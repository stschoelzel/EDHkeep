import type { MTGCard } from "./types";
import { SCRYFALL_BATCH_SIZE, SCRYFALL_DELAY, SCRYFALL_CACHE_TTL } from "./constants";

type ScryfallIdentifier =
  | { set: string; collector_number: string }
  | { name: string; set?: string };

interface ScryfallCard {
  name: string;
  set: string;
  collector_number: string;
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

/** Build a cache key from set + collector_number, falling back to name */
function cacheKey(card: { name: string; set_code?: string; collector_number?: string }): string {
  if (card.set_code && card.set_code !== "UNK" && card.collector_number && card.collector_number !== "0") {
    return `${card.set_code.toLowerCase()}|${card.collector_number}`;
  }
  return `name|${card.name.split(" // ")[0].trim().toLowerCase()}`;
}

function cacheKeyFromScryfall(card: ScryfallCard): string {
  return `${card.set.toLowerCase()}|${card.collector_number}`;
}

function getCached(key: string): CachedCard | null {
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

  const entry: CachedCard = {
    type_line: card.type_line,
    image_uris: imageUris,
    prices: card.prices ?? undefined,
    timestamp: Date.now(),
  };

  // Cache by set+number (primary) and by name (secondary, for name-based lookups)
  cardCache.set(cacheKeyFromScryfall(card), entry);
  cardCache.set(`name|${card.name.split(" // ")[0].trim().toLowerCase()}`, entry);
}

// ── Fallback image URL ──

/**
 * Build a Scryfall API URL that redirects to the card image.
 * More reliable than the static URL pattern above.
 */
function buildScryfallApiImageUrl(setCode: string, collectorNumber: string): string {
  return `https://api.scryfall.com/cards/${setCode.toLowerCase()}/${encodeURIComponent(collectorNumber)}?format=image&version=normal`;
}

// ── API ──

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBatch(
  identifiers: ScryfallIdentifier[]
): Promise<ScryfallCard[]> {
  try {
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
  } catch (err) {
    console.error("Scryfall batch fetch error:", err);
    return [];
  }
}

/**
 * Enrich MTGCards with Scryfall image_uris, prices, and type_line.
 * Enriches ALL cards so images are always available.
 * Prefers set+collector_number identifiers for reliable matching.
 * Falls back to Scryfall API image URLs when the collection API can't match.
 * Uses in-memory cache to avoid redundant API calls.
 */
export async function enrichWithScryfall(cards: MTGCard[]): Promise<MTGCard[]> {
  if (cards.length === 0) return cards;

  // Split into cached vs uncached
  const uncachedCards: MTGCard[] = [];
  const resolvedLookup = new Map<string, CachedCard>();

  for (const card of cards) {
    const key = cacheKey(card);
    const cached = getCached(key);
    if (cached) {
      resolvedLookup.set(key, cached);
    } else {
      uncachedCards.push(card);
    }
  }

  // Only fetch uncached cards from Scryfall
  if (uncachedCards.length > 0) {
    // Deduplicate by cache key to minimize API calls
    const seen = new Set<string>();
    const identifiers: ScryfallIdentifier[] = [];
    const keyToCardMap = new Map<string, MTGCard>();

    for (const c of uncachedCards) {
      const key = cacheKey(c);
      if (seen.has(key)) continue;
      seen.add(key);
      keyToCardMap.set(key, c);

      // Prefer set + collector_number (most reliable Scryfall matching)
      if (c.set_code && c.set_code !== "UNK" && c.collector_number && c.collector_number !== "0") {
        identifiers.push({
          set: c.set_code.toLowerCase(),
          collector_number: c.collector_number,
        });
      } else {
        // Fall back to name-based lookup
        const id: { name: string; set?: string } = {
          name: c.name.split(" // ")[0].trim(),
        };
        if (c.set_code && c.set_code !== "UNK") {
          id.set = c.set_code.toLowerCase();
        }
        identifiers.push(id);
      }
    }

    // Batch fetch from Scryfall
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
        const key = cacheKeyFromScryfall(card);
        const nameKey = `name|${card.name.split(" // ")[0].trim().toLowerCase()}`;
        const entry: CachedCard = {
          type_line: card.type_line,
          image_uris: imageUris,
          prices: card.prices ?? undefined,
          timestamp: Date.now(),
        };
        resolvedLookup.set(key, entry);
        resolvedLookup.set(nameKey, entry);
      }
    }
  }

  const cacheHits = cards.length - uncachedCards.length;
  if (cacheHits > 0) {
    console.log(`Scryfall cache: ${cacheHits} hits, ${uncachedCards.length} fetched`);
  }

  // Merge data back onto all cards, with fallback image URLs
  return cards.map((card) => {
    const key = cacheKey(card);
    const enriched = resolvedLookup.get(key);

    // Build fallback image URIs if Scryfall didn't return any
    let finalImageUris = enriched?.image_uris;
    if (!finalImageUris && card.set_code && card.set_code !== "UNK" && card.collector_number && card.collector_number !== "0") {
      const apiUrl = buildScryfallApiImageUrl(card.set_code, card.collector_number);
      finalImageUris = {
        normal: apiUrl,
        small: apiUrl.replace("version=normal", "version=small"),
      };
    }

    if (!enriched && !finalImageUris) return card;

    return {
      ...card,
      type_line: enriched?.type_line ?? card.type_line,
      image_uris: finalImageUris ?? card.image_uris,
      prices: enriched?.prices ?? card.prices,
    };
  });
}
