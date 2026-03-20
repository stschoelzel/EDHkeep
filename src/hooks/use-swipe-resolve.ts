"use client";

import { useCallback } from "react";
import { useCollectionStore } from "@/stores/collection-store";
import type { SwipeDirection } from "@/lib/types";

interface UseSwipeResolveReturn {
  resolve: (cardName: string, direction: SwipeDirection) => void;
}

/**
 * Maps swipe directions to category actions:
 * - left = Keep
 * - right = Fail
 * - up = Skip (stays Pending, moves to end of queue)
 */
export function useSwipeResolve(): UseSwipeResolveReturn {
  const resolveCard = useCollectionStore((s) => s.resolveCard);
  const skipCard = useCollectionStore((s) => s.skipCard);

  const resolve = useCallback(
    (cardName: string, direction: SwipeDirection) => {
      switch (direction) {
        case "left":
          resolveCard(cardName, "Keep");
          break;
        case "right":
          resolveCard(cardName, "Fail");
          break;
        case "up":
          skipCard(cardName);
          break;
      }
    },
    [resolveCard, skipCard]
  );

  return { resolve };
}
