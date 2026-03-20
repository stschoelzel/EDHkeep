"use client";

import { useState, useCallback } from "react";
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

      // Delay to allow exit animation
      setTimeout(() => {
        onResolve(card.name, direction);
        setIndex((prev) => prev + 1);
      }, 200);
    },
    [cards, index, onResolve]
  );

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

      {/* Counter */}
      <p className="text-center font-mono text-xs text-foreground-muted">
        {index + 1} / {cards.length}
      </p>
    </div>
  );
}
