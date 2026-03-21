"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CardRow } from "./card-row";
import { ExportPanel } from "./export-panel";
import type { MTGCard, CardCategory } from "@/lib/types";

interface CardListProps {
  title: string;
  cards: MTGCard[];
  variant: "keep" | "pending" | "fail";
  defaultOpen?: boolean;
  preSorted?: boolean;
}

const variantColors: Record<string, string> = {
  keep: "text-keep",
  pending: "text-pending",
  fail: "text-fail",
};

function sortCards(cards: MTGCard[]): MTGCard[] {
  return [...cards].sort((a, b) => {
    const colorA = a.color_identity ?? "";
    const colorB = b.color_identity ?? "";
    if (colorA !== colorB) return colorA.localeCompare(colorB);
    return a.name.localeCompare(b.name);
  });
}

export function CardList({
  title,
  cards,
  variant,
  defaultOpen = false,
  preSorted = false,
}: CardListProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sorted = preSorted ? cards : sortCards(cards);

  return (
    <div className="bg-surface-low rounded-none">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 hover:bg-surface-high transition-colors">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsOpen(!isOpen); } }}
          className="flex items-center gap-3 cursor-pointer"
        >
          {isOpen ? (
            <ChevronDown size={16} className="text-foreground-muted" />
          ) : (
            <ChevronRight size={16} className="text-foreground-muted" />
          )}
          <h3
            className={`font-display text-lg uppercase tracking-tight ${variantColors[variant]}`}
          >
            {title}
          </h3>
          <span className="font-mono text-xs text-foreground-muted">
            {cards.length}
          </span>
        </div>

        {isOpen && cards.length > 0 && (
          <ExportPanel cards={cards} />
        )}
      </div>

      {/* Card rows */}
      {isOpen && (
        <div className="pb-2">
          {sorted.length === 0 ? (
            <p className="px-6 py-8 text-center font-mono text-xs text-foreground-muted">
              No cards
            </p>
          ) : (
            sorted.map((card, i) => (
              <CardRow key={`${card.name}-${card.set_code}-${card.collector_number}-${i}`} card={card} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
