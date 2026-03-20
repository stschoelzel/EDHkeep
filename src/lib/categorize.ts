import type { MTGCard, EDHRecColor, EDHRecCardView } from "./types";
import { COLORS, COLOR_DISPLAY, PENDING_BUFFER } from "./constants";
import { fetchEDHRecTop } from "./edhrec-client";
import { calculateElbow } from "./elbow";

/** Normalize split card names: "Fire // Ice" → "fire" */
function normalizeName(name: string): string {
  return name.split(" // ")[0].trim().toLowerCase();
}

interface CardMeta {
  rank: number;
  url: string;
  color: string;
  inclusion: number;
}

interface ColorData {
  color: EDHRecColor;
  cards: EDHRecCardView[];
  elbowIndex: number;
  keepMap: Map<string, CardMeta>;
  pendingMap: Map<string, CardMeta>;
}

/**
 * Process a single color: fetch top cards, run elbow, build keep/pending maps.
 */
async function processColor(color: EDHRecColor): Promise<ColorData> {
  const cards = await fetchEDHRecTop(color);
  const numDecks = cards.map((c) => c.num_decks);
  const elbowIndex = calculateElbow(numDecks);

  const keepMap = new Map<string, CardMeta>();
  const pendingMap = new Map<string, CardMeta>();

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const normalized = normalizeName(card.name);
    const meta: CardMeta = {
      rank: i + 1,
      url: card.url ? `https://edhrec.com${card.url}` : "",
      color: COLOR_DISPLAY[color],
      inclusion: card.num_decks,
    };

    if (i < elbowIndex) {
      keepMap.set(normalized, meta);
    } else if (i < elbowIndex + PENDING_BUFFER) {
      pendingMap.set(normalized, meta);
    }
  }

  return { color, cards, elbowIndex, keepMap, pendingMap };
}

export interface CategorizationProgress {
  step: string;
  detail: string;
  percent: number;
}

/**
 * Categorize a collection of cards using EDHRec data + Elbow Method.
 *
 * @param cards - Parsed MTGCard stubs (all initially "Pending")
 * @param onProgress - Optional callback for streaming progress
 * @returns Categorized cards with EDHRec metadata attached
 */
export async function categorizeCollection(
  cards: MTGCard[],
  onProgress?: (p: CategorizationProgress) => void
): Promise<MTGCard[]> {
  // Fetch all 5 colors in parallel
  const colorPromises = COLORS.map((color, i) => {
    return processColor(color).then((result) => {
      const colorNames = ["White", "Blue", "Black", "Red", "Green"];
      onProgress?.({
        step: `fetching_${color}`,
        detail: `Fetched ${colorNames[i]} top cards (${result.cards.length} cards, elbow at #${result.elbowIndex})`,
        percent: 15 + i * 12,
      });
      return result;
    });
  });

  const colorResults = await Promise.all(colorPromises);

  onProgress?.({
    step: "categorizing",
    detail: "Running elbow algorithm and categorizing cards...",
    percent: 75,
  });

  // Merge all color maps: Keep takes priority over Pending
  const globalKeep = new Map<string, CardMeta>();
  const globalPending = new Map<string, CardMeta>();

  for (const result of colorResults) {
    for (const [name, meta] of result.keepMap) {
      // Keep always wins
      globalKeep.set(name, meta);
      globalPending.delete(name);
    }
    for (const [name, meta] of result.pendingMap) {
      // Only add to pending if not already in keep
      if (!globalKeep.has(name)) {
        globalPending.set(name, meta);
      }
    }
  }

  // Categorize each card
  return cards.map((card) => {
    const normalized = normalizeName(card.name);
    const keepMeta = globalKeep.get(normalized);
    const pendingMeta = globalPending.get(normalized);

    if (keepMeta) {
      return {
        ...card,
        category: "Keep" as const,
        edhrec_rank: keepMeta.rank,
        edhrec_url: keepMeta.url,
        color_identity: keepMeta.color,
        inclusion_rate: keepMeta.inclusion,
      };
    }

    if (pendingMeta) {
      return {
        ...card,
        category: "Pending" as const,
        edhrec_rank: pendingMeta.rank,
        edhrec_url: pendingMeta.url,
        color_identity: pendingMeta.color,
        inclusion_rate: pendingMeta.inclusion,
      };
    }

    return { ...card, category: "Fail" as const };
  });
}
