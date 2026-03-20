import type { MTGCard } from "./types";
import { SCRYFALL_BATCH_SIZE, SCRYFALL_DELAY } from "./constants";

interface ScryfallIdentifier {
  name: string;
  set?: string;
  collector_number?: string;
}

interface ScryfallCard {
  name: string;
  image_uris?: Record<string, string>;
  card_faces?: Array<{ image_uris?: Record<string, string> }>;
  prices?: Record<string, string | null>;
}

interface ScryfallCollectionResponse {
  data: ScryfallCard[];
  not_found: unknown[];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch card data from Scryfall's /cards/collection endpoint.
 * Batches into groups of 75 with rate-limiting delays.
 */
async function fetchBatch(
  identifiers: ScryfallIdentifier[]
): Promise<ScryfallCard[]> {
  const res = await fetch("https://api.scryfall.com/cards/collection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifiers }),
  });

  if (!res.ok) {
    console.error(`Scryfall batch failed: ${res.status}`);
    return [];
  }

  const data = (await res.json()) as ScryfallCollectionResponse;
  return data.data ?? [];
}

/**
 * Enrich MTGCards with Scryfall image_uris and prices.
 * Only enriches cards with category Keep or Pending to save API calls.
 */
export async function enrichWithScryfall(cards: MTGCard[]): Promise<MTGCard[]> {
  const toEnrich = cards.filter(
    (c) => c.category === "Keep" || c.category === "Pending"
  );

  if (toEnrich.length === 0) return cards;

  // Build identifiers
  const identifiers: ScryfallIdentifier[] = toEnrich.map((c) => {
    const id: ScryfallIdentifier = { name: c.name };
    if (c.set_code && c.set_code !== "UNK") {
      id.set = c.set_code.toLowerCase();
    }
    return id;
  });

  // Batch fetch
  const allResults: ScryfallCard[] = [];
  for (let i = 0; i < identifiers.length; i += SCRYFALL_BATCH_SIZE) {
    if (i > 0) await delay(SCRYFALL_DELAY);
    const batch = identifiers.slice(i, i + SCRYFALL_BATCH_SIZE);
    const results = await fetchBatch(batch);
    allResults.push(...results);
  }

  // Build lookup by normalized name
  const lookup = new Map<string, ScryfallCard>();
  for (const card of allResults) {
    lookup.set(card.name.toLowerCase(), card);
  }

  // Merge data back onto cards
  return cards.map((card) => {
    const scryfall = lookup.get(card.name.toLowerCase());
    if (!scryfall) return card;

    // Handle double-faced cards where image_uris is on card_faces
    const imageUris =
      scryfall.image_uris ??
      scryfall.card_faces?.[0]?.image_uris ??
      undefined;

    return {
      ...card,
      image_uris: imageUris,
      prices: scryfall.prices ?? undefined,
    };
  });
}
