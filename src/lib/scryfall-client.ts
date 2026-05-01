import type { MTGCard } from "./types";
import { SCRYFALL_BATCH_SIZE, SCRYFALL_DELAY, SCRYFALL_CACHE_TTL } from "./constants";

type ScryfallIdentifier =
  | { set: string; collector_number: string }
  | { name: string; set?: string };

interface ScryfallCard {
  id?: string;
  oracle_id?: string;
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
  id?: string;
  oracle_id?: string;
  name?: string;
  set_code?: string;
  collector_number?: string;
  type_line?: string;
  image_uris?: Record<string, string>;
  prices?: Record<string, string | null>;
  timestamp: number;
}

interface CachedCardRecord extends CachedCard {
  key: string;
}

const cardCache = new Map<string, CachedCard>();

const DB_NAME = "edhkeep";
const DB_VERSION = 2;
const SCRYFALL_STORE = "scryfall_cards";

let dbPromise: Promise<IDBDatabase | null> | null = null;

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

function cacheEntriesFromScryfall(card: ScryfallCard): Array<[string, CachedCard]> {
  const imageUris =
    card.image_uris ??
    card.card_faces?.[0]?.image_uris ??
    undefined;

  const entry: CachedCard = {
    id: card.id,
    oracle_id: card.oracle_id,
    name: card.name,
    set_code: card.set,
    collector_number: card.collector_number,
    type_line: card.type_line,
    image_uris: imageUris,
    prices: card.prices ?? undefined,
    timestamp: Date.now(),
  };

  return [
    [cacheKeyFromScryfall(card), entry],
    [`name|${card.name.split(" // ")[0].trim().toLowerCase()}`, entry],
  ];
}

function setMemoryCached(entries: Array<[string, CachedCard]>): void {
  for (const [key, entry] of entries) {
    cardCache.set(key, entry);
  }
}

function canUseIndexedDB(): boolean {
  return typeof indexedDB !== "undefined";
}

function openScryfallCacheDb(): Promise<IDBDatabase | null> {
  if (!canUseIndexedDB()) return Promise.resolve(null);

  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (db.objectStoreNames.contains(SCRYFALL_STORE) && event.oldVersion < 2) {
          db.deleteObjectStore(SCRYFALL_STORE);
        }
        if (!db.objectStoreNames.contains(SCRYFALL_STORE)) {
          db.createObjectStore(SCRYFALL_STORE, { keyPath: "key" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn("IndexedDB Scryfall cache unavailable:", request.error);
        resolve(null);
      };
      request.onblocked = () => {
        console.warn("IndexedDB Scryfall cache blocked by another tab");
        resolve(null);
      };
    });
  }

  return dbPromise;
}

function isFresh(entry: CachedCard): boolean {
  return Date.now() - entry.timestamp <= SCRYFALL_CACHE_TTL;
}

async function getPersistentCached(keys: string[]): Promise<Map<string, CachedCard>> {
  const db = await openScryfallCacheDb();
  const result = new Map<string, CachedCard>();
  if (!db || keys.length === 0) return result;

  return new Promise((resolve) => {
    const transaction = db.transaction(SCRYFALL_STORE, "readonly");
    const store = transaction.objectStore(SCRYFALL_STORE);
    let pending = keys.length;

    const finishOne = () => {
      pending -= 1;
      if (pending === 0) resolve(result);
    };

    transaction.onerror = () => {
      console.warn("IndexedDB Scryfall cache read failed:", transaction.error);
      resolve(result);
    };

    for (const key of keys) {
      const request = store.get(key);
      request.onsuccess = () => {
        const record = request.result as CachedCardRecord | undefined;
        if (record && isFresh(record)) {
          const entry: CachedCard = {
            id: record.id,
            oracle_id: record.oracle_id,
            name: record.name,
            set_code: record.set_code,
            collector_number: record.collector_number,
            type_line: record.type_line,
            image_uris: record.image_uris,
            prices: record.prices,
            timestamp: record.timestamp,
          };
          result.set(key, entry);
          cardCache.set(key, entry);
        }
        finishOne();
      };
      request.onerror = finishOne;
    }
  });
}

async function setPersistentCached(entries: Array<[string, CachedCard]>): Promise<void> {
  const db = await openScryfallCacheDb();
  if (!db || entries.length === 0) return;

  return new Promise((resolve) => {
    const transaction = db.transaction(SCRYFALL_STORE, "readwrite");
    const store = transaction.objectStore(SCRYFALL_STORE);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
      console.warn("IndexedDB Scryfall cache write failed:", transaction.error);
      resolve();
    };

    for (const [key, entry] of entries) {
      store.put({ key, ...entry } satisfies CachedCardRecord);
    }
  });
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
 * Uses in-memory and IndexedDB caches to avoid redundant API calls.
 */
export async function enrichWithScryfall(cards: MTGCard[]): Promise<MTGCard[]> {
  if (cards.length === 0) return cards;

  // Split into memory-cached vs persistent-cache candidates.
  const missingMemoryCards: MTGCard[] = [];
  const resolvedLookup = new Map<string, CachedCard>();
  const missingKeys = new Set<string>();

  for (const card of cards) {
    const key = cacheKey(card);
    const cached = getCached(key);
    if (cached) {
      resolvedLookup.set(key, cached);
    } else {
      missingMemoryCards.push(card);
      missingKeys.add(key);
    }
  }

  const persistentHits = await getPersistentCached([...missingKeys]);
  const uncachedCards: MTGCard[] = [];

  for (const card of missingMemoryCards) {
    const key = cacheKey(card);
    const cached = persistentHits.get(key);
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
      const persistentEntries: Array<[string, CachedCard]> = [];

      for (const card of results) {
        const entries = cacheEntriesFromScryfall(card);
        setMemoryCached(entries);
        persistentEntries.push(...entries);

        for (const [key, entry] of entries) {
          resolvedLookup.set(key, entry);
        }
      }

      await setPersistentCached(persistentEntries);
    }
  }

  const memoryHits = cards.length - missingMemoryCards.length;
  const indexedDbHits = persistentHits.size;
  if (memoryHits > 0 || indexedDbHits > 0) {
    console.log(
      `Scryfall cache: ${memoryHits} memory hits, ${indexedDbHits} IndexedDB hits, ` +
        `${uncachedCards.length} fetched`
    );
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
      id: enriched?.id ?? card.id,
      oracle_id: enriched?.oracle_id ?? card.oracle_id,
      name: enriched?.name ?? card.name,
      set_code: enriched?.set_code ?? card.set_code,
      collector_number: enriched?.collector_number ?? card.collector_number,
      type_line: enriched?.type_line ?? card.type_line,
      image_uris: finalImageUris ?? card.image_uris,
      prices: enriched?.prices ?? card.prices,
    };
  });
}
