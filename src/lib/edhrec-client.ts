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
    const res = await fetch(url, {
      headers: { "User-Agent": "EDHKeep/1.0" },
    });

    if (!res.ok) {
      console.error(`EDHRec fetch failed for ${colorName}: ${res.status}`);
      return [];
    }

    const data = (await res.json()) as Record<string, unknown>;
    const cards = parseCardList(data);

    cache.set(cacheKey, { data: cards, timestamp: Date.now() });
    return cards;
  } catch (err) {
    console.error(`EDHRec fetch error for ${colorName}:`, err);
    return [];
  }
}
