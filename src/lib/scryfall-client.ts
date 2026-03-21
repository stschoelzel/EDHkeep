import type { MTGCard } from "./types";
import { SCRYFALL_BATCH_SIZE, SCRYFALL_DELAY, SCRYFALL_CACHE_TTL } from "./constants";

interface ScryfallIdentifier {
  name: string;
  set?: string;
  collector_number?: string;
}

interface ScryfallCard {
  name: string;
  type_line?: string;
  image_uris?: Record<string, string>;
  card_faces?: Array<{ image_uris?: Record<string, string> }>;
  prices?: Record<string, string | null>;
}

interface ScryfallCollectionResponse {
  data: ScryfallCard[];
  not_found: unknown[];
}

// ── In-memory cache ──

interface CachedCard {
  type_line?: string;
  image_uris?: Record<string, string>;
  prices?: Record<string, string | null>;
  timestamp: number;
}

const cardCache = new Map<string, CachedCard>();

function getCached(name: string): CachedCard | null {
  const key = name.toLowerCase();
  const entry = cardCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > SCRYFALL_CACHE_TTL) {
    cardCache.delete(key);
    return null;
  }
  return entry;
}

function setCached(card: ScryfallCard): void {
  const imageUris =
    card.image_uris ??
    card.card_faces?.[0]?.image_uris ??
    undefined;

  cardCache.set(card.name.toLowerCase(), {
    type_line: card.type_line,
    image_uris: imageUris,
    prices: card.prices ?? undefined,
    timestamp: Date.now(),
  });
}

// ── API ──

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
 * Enrich MTGCards with Scryfall image_uris, prices, and type_line.
 * Only enriches cards with category Keep or Pending.
 * Uses in-memory cache to avoid redundant API calls.
 */
export async function enrichWithScryfall(cards: MTGCard[]): Promise<MTGCard[]> {
  const toEnrich = cards.filter(
    (c) => c.category === "Keep" || c.category === "Pending"
  );

  if (toEnrich.length === 0) return cards;

  // Split into cached vs uncached
  const uncached: MTGCard[] = [];
  const cachedLookup = new Map<string, CachedCard>();

  for (const card of toEnrich) {
    const cached = getCached(card.name);
    if (cached) {
      cachedLookup.set(card.name.toLowerCase(), cached);
    } else {
      uncached.push(card);
    }
  }

  // Only fetch uncached cards from Scryfall
  if (uncached.length > 0) {
    // Deduplicate by name to minimize API calls
    const seen = new Set<string>();
    const identifiers: ScryfallIdentifier[] = [];
    for (const c of uncached) {
      const key = c.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const id: ScryfallIdentifier = { name: c.name };
      if (c.set_code && c.set_code !== "UNK") {
        id.set = c.set_code.toLowerCase();
      }
      identifiers.push(id);
    }

    // Batch fetch
    for (let i = 0; i < identifiers.length; i += SCRYFALL_BATCH_SIZE) {
      if (i > 0) await delay(SCRYFALL_DELAY);
      const batch = identifiers.slice(i, i + SCRYFALL_BATCH_SIZE);
      const results = await fetchBatch(batch);
      for (const card of results) {
        setCached(card);
        const imageUris =
          card.image_uris ??
          card.card_faces?.[0]?.image_uris ??
          undefined;
        cachedLookup.set(card.name.toLowerCase(), {
          type_line: card.type_line,
          image_uris: imageUris,
          prices: card.prices ?? undefined,
          timestamp: Date.now(),
        });
      }
    }
  }

  const cacheHits = toEnrich.length - uncached.length;
  if (cacheHits > 0) {
    console.log(`Scryfall cache: ${cacheHits} hits, ${uncached.length} fetched`);
  }

  // Merge data back onto all cards
  return cards.map((card) => {
    const enriched = cachedLookup.get(card.name.toLowerCase());
    if (!enriched) return card;

    return {
      ...card,
      type_line: enriched.type_line ?? card.type_line,
      image_uris: enriched.image_uris,
      prices: enriched.prices ?? undefined,
    };
  });
}
