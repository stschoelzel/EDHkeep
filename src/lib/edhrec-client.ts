import type { EDHRecColor, EDHRecCardView } from "./types";
import { COLOR_NAME, EDHREC_CACHE_TTL } from "./constants";

interface CacheEntry {
  data: EDHRecCardView[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Parse the EDHRec JSON response into a flat list of card views.
 * Handles both container.json_dict.cardlists and container.cardlists shapes.
 */
function parseCardList(data: Record<string, unknown>): EDHRecCardView[] {
  const container = data.container as Record<string, unknown> | undefined;
  if (!container) return [];

  // Try json_dict.cardlists first, fall back to cardlists directly
  const jsonDict = container.json_dict as Record<string, unknown> | undefined;
  const cardlists = (jsonDict?.cardlists ?? container.cardlists) as
    | Array<{ cardviews?: EDHRecCardView[] }>
    | undefined;

  if (!Array.isArray(cardlists)) return [];

  const cards: EDHRecCardView[] = [];
  for (const list of cardlists) {
    if (Array.isArray(list.cardviews)) {
      for (const card of list.cardviews) {
        if (card.name && typeof card.num_decks === "number") {
          cards.push({
            name: card.name,
            num_decks: card.num_decks,
            url: card.url ?? "",
          });
        }
      }
    }
  }

  return cards;
}

/**
 * CORS proxy URLs to try when direct fetch fails.
 * EDHRec's JSON API does not set Access-Control-Allow-Origin for browsers.
 */
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

/**
 * Fetch JSON from a URL, trying direct first, then CORS proxies.
 */
async function fetchWithCORSFallback(url: string): Promise<Record<string, unknown>> {
  // Try direct fetch first (works in dev / same-origin / if EDHRec allows it)
  try {
    const res = await fetch(url);
    if (res.ok) {
      return (await res.json()) as Record<string, unknown>;
    }
  } catch {
    // CORS or network error — fall through to proxies
  }

  // Try CORS proxies
  for (const proxyFn of CORS_PROXIES) {
    try {
      const proxied = proxyFn(url);
      const res = await fetch(proxied);
      if (res.ok) {
        return (await res.json()) as Record<string, unknown>;
      }
    } catch {
      // Try next proxy
    }
  }

  throw new Error(`Failed to fetch ${url} (all CORS proxies exhausted)`);
}

/**
 * Fetch top cards for a color from EDHRec.
 * Results are cached in-memory for 1 hour.
 */
export async function fetchEDHRecTop(
  color: EDHRecColor
): Promise<EDHRecCardView[]> {
  const cacheKey = color;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < EDHREC_CACHE_TTL) {
    return cached.data;
  }

  const colorName = COLOR_NAME[color];
  const url = `https://json.edhrec.com/pages/top/${colorName}.json`;

  try {
    const data = await fetchWithCORSFallback(url);
    const cards = parseCardList(data);

    cache.set(cacheKey, { data: cards, timestamp: Date.now() });
    return cards;
  } catch (err) {
    console.error(`EDHRec fetch error for ${colorName}:`, err);
    return [];
  }
}
