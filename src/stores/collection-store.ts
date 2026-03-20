import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import type { MTGCard, CategoryStats, UploadResponse } from "@/lib/types";

interface CollectionState {
  filename: string | null;
  allCards: MTGCard[];
  stats: CategoryStats;

  setAnalysisResult: (result: UploadResponse) => void;
  resolveCard: (cardName: string, newCategory: "Keep" | "Fail") => void;
  skipCard: (cardName: string) => void;
  reset: () => void;
}

const initialStats: CategoryStats = { Keep: 0, Pending: 0, Fail: 0 };

export const useCollectionStore = create<CollectionState>((set) => ({
  filename: null,
  allCards: [],
  stats: { ...initialStats },

  setAnalysisResult: (result) =>
    set({
      filename: result.filename,
      allCards: result.all_cards,
      stats: { ...result.stats },
    }),

  resolveCard: (cardName, newCategory) =>
    set((state) => {
      const allCards = state.allCards.map((card) => {
        if (card.name === cardName && card.category === "Pending") {
          return { ...card, category: newCategory };
        }
        return card;
      });

      const stats = { Keep: 0, Pending: 0, Fail: 0 } as CategoryStats;
      for (const card of allCards) {
        stats[card.category]++;
      }

      return { allCards, stats };
    }),

  skipCard: (cardName) =>
    set((state) => {
      const idx = state.allCards.findIndex(
        (c) => c.name === cardName && c.category === "Pending"
      );
      if (idx === -1) return state;

      const allCards = [...state.allCards];
      const [card] = allCards.splice(idx, 1);
      allCards.push(card);
      return { allCards };
    }),

  reset: () =>
    set({
      filename: null,
      allCards: [],
      stats: { ...initialStats },
    }),
}));

// Selectors using useShallow to prevent infinite re-render loops
export const useKeepCards = () =>
  useCollectionStore(
    useShallow((s) => s.allCards.filter((c) => c.category === "Keep"))
  );

export const usePendingCards = () =>
  useCollectionStore(
    useShallow((s) => s.allCards.filter((c) => c.category === "Pending"))
  );

export const useFailCards = () =>
  useCollectionStore(
    useShallow((s) => s.allCards.filter((c) => c.category === "Fail"))
  );
