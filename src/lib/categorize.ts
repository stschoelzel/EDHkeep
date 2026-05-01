import type { MTGCard } from "./types";
import { normalizeGameplayName } from "./card-identity";

interface StaticTopCard {
  rank: number;
  category: "Keep" | "Pending" | "Fail";
  name: string;
  edhrec_url?: string;
  num_decks: number;
  inclusion_rate: number;
  scryfall?: {
    color_identity?: string[];
  } | null;
}

interface StaticTopCardsData {
  generated_at: string;
  count: number;
  category_method: string;
  thresholds: {
    keep_inclusion_rate: number;
    pending_inclusion_rate: number;
  };
  cards: StaticTopCard[];
}

interface CardMeta {
  rank: number;
  url: string;
  color: string;
  inclusion: number;
}

export interface CategorizationProgress {
  step: string;
  detail: string;
  percent: number;
}

const TOP_CARDS_URL = "/data/edhrec-top-cards.json";

let topCardsDataPromise: Promise<StaticTopCardsData> | null = null;

function formatColorIdentity(colorIdentity?: string[]): string {
  if (!colorIdentity || colorIdentity.length === 0) return "Colorless";
  return colorIdentity.join("");
}

async function loadTopCardsData(): Promise<StaticTopCardsData> {
  if (!topCardsDataPromise) {
    topCardsDataPromise = fetch(TOP_CARDS_URL).then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to load static EDHRec top-card data: ${response.status} ${response.statusText}`
        );
      }

      return (await response.json()) as StaticTopCardsData;
    });
  }

  return topCardsDataPromise;
}

function buildRankMaps(cards: StaticTopCard[]): {
  keepMap: Map<string, CardMeta>;
  pendingMap: Map<string, CardMeta>;
} {
  const keepMap = new Map<string, CardMeta>();
  const pendingMap = new Map<string, CardMeta>();

  for (const card of cards) {
    const normalized = normalizeGameplayName(card.name);
    const meta: CardMeta = {
      rank: card.rank,
      url: card.edhrec_url ?? "",
      color: formatColorIdentity(card.scryfall?.color_identity),
      inclusion: card.num_decks,
    };

    if (card.category === "Keep") {
      keepMap.set(normalized, meta);
      pendingMap.delete(normalized);
    } else if (card.category === "Pending" && !keepMap.has(normalized)) {
      pendingMap.set(normalized, meta);
    }
  }

  return { keepMap, pendingMap };
}

// Basic lands are always Fail, even if they appear in an external top-card source.
const BASIC_LANDS = new Set([
  "plains",
  "island",
  "swamp",
  "mountain",
  "forest",
  "wastes",
  "snow-covered plains",
  "snow-covered island",
  "snow-covered swamp",
  "snow-covered mountain",
  "snow-covered forest",
]);

/**
 * Categorize a collection of cards using generated EDHRec yearly top-card data.
 *
 * @param cards - Parsed MTGCard stubs (all initially "Pending")
 * @param onProgress - Optional callback for streaming progress
 * @returns Categorized cards with EDHRec metadata attached
 */
export async function categorizeCollection(
  cards: MTGCard[],
  onProgress?: (p: CategorizationProgress) => void
): Promise<MTGCard[]> {
  onProgress?.({
    step: "loading_top_cards",
    detail: "Loading static EDHRec top-card data...",
    percent: 15,
  });

  const topCardsData = await loadTopCardsData();
  const { keepMap, pendingMap } = buildRankMaps(topCardsData.cards);

  onProgress?.({
    step: "categorizing",
    detail:
      `Categorizing with ${topCardsData.count} EDHRec cards ` +
      `(${(topCardsData.thresholds.keep_inclusion_rate * 100).toFixed(1)}% Keep, ` +
      `${(topCardsData.thresholds.pending_inclusion_rate * 100).toFixed(1)}% Pending thresholds)...`,
    percent: 75,
  });

  return cards.map((card) => {
    const normalized = normalizeGameplayName(card.name);

    if (BASIC_LANDS.has(normalized)) {
      return { ...card, category: "Fail" as const };
    }

    const keepMeta = keepMap.get(normalized);
    const pendingMeta = pendingMap.get(normalized);

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
