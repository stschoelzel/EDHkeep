"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { SwipeCard } from "./swipe-card";
import { Button } from "./ui/button";
import type { MTGCard, SwipeDirection } from "@/lib/types";

interface PendingSwiperProps {
  cards: MTGCard[];
  onResolve: (cardName: string, direction: SwipeDirection) => void;
}

export function PendingSwiper({ cards, onResolve }: PendingSwiperProps) {
  const [index, setIndex] = useState(0);

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      const card = cards[index];
      if (!card) return;

      setTimeout(() => {
        onResolve(card.name, direction);
        setIndex((prev) => prev + 1);
      }, 200);
    },
    [cards, index, onResolve]
  );

  // Keyboard support: arrow keys
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (index >= cards.length) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          handleSwipe("left");
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSwipe("right");
          break;
        case "ArrowUp":
          e.preventDefault();
          handleSwipe("up");
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSwipe, index, cards.length]);

  // All reviewed
  if (index >= cards.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="font-display text-2xl text-foreground uppercase tracking-tight">
          All reviewed
        </p>
        <p className="font-mono text-xs text-foreground-muted">
          {cards.length} cards processed
        </p>
      </div>
    );
  }

  const currentCard = cards[index];
  const nextCard = cards[index + 1];

  return (
    <div className="flex flex-col gap-6">
      {/* Card stack */}
      <div className="relative w-full aspect-[3/4] max-h-[500px]">
        <AnimatePresence>
          {nextCard && (
            <SwipeCard
              key={nextCard.name + "-next"}
              card={nextCard}
              onSwipe={() => {}}
              isTop={false}
            />
          )}
          {currentCard && (
            <SwipeCard
              key={currentCard.name}
              card={currentCard}
              onSwipe={handleSwipe}
              isTop={true}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="keep" onClick={() => handleSwipe("left")}>
          <ArrowLeft size={16} className="mr-2 inline" />
          Keep
        </Button>
        <Button variant="ghost" onClick={() => handleSwipe("up")}>
          <ArrowUp size={16} className="mr-2 inline" />
          Skip
        </Button>
        <Button variant="fail" onClick={() => handleSwipe("right")}>
          Fail
          <ArrowRight size={16} className="ml-2 inline" />
        </Button>
      </div>

      {/* Counter + keyboard hint */}
      <p className="text-center font-mono text-xs text-foreground-muted">
        {index + 1} / {cards.length}
        <span className="ml-4 text-foreground-muted/50">
          ← → ↑ arrow keys
        </span>
      </p>
    </div>
  );
}
