"use client";

import { useState, useMemo } from "react";
import {
  useCollectionStore,
  useKeepCards,
  usePendingCards,
  useFailCards,
} from "@/stores/collection-store";
import { useSwipeResolve } from "@/hooks/use-swipe-resolve";
import { StatsChart } from "./stats-chart";
import { PendingSwiper } from "./pending-swiper";
import { CardList } from "./card-list";
import { SortBar, type SortField, type GroupBy } from "./sort-bar";
import type { MTGCard } from "@/lib/types";

// ── Sorting ──

function getPrice(card: MTGCard): number {
  const usd = card.prices?.usd;
  return usd ? parseFloat(usd) : 0;
}

const PRIMARY_TYPES = [
  "Creature",
  "Instant",
  "Sorcery",
  "Enchantment",
  "Artifact",
  "Land",
  "Planeswalker",
  "Battle",
] as const;

function getPrimaryType(card: MTGCard): string {
  const line = card.type_line ?? "";
  for (const t of PRIMARY_TYPES) {
    if (line.includes(t)) return t;
  }
  return "Other";
}

function applySortField(cards: MTGCard[], sortBy: SortField): MTGCard[] {
  return [...cards].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "color": {
        const ca = a.color_identity ?? "";
        const cb = b.color_identity ?? "";
        if (ca !== cb) return ca.localeCompare(cb);
        return a.name.localeCompare(b.name);
      }
      case "type": {
        const ta = getPrimaryType(a);
        const tb = getPrimaryType(b);
        if (ta !== tb) return ta.localeCompare(tb);
        return a.name.localeCompare(b.name);
      }
      case "rank": {
        const ra = a.edhrec_rank ?? 99999;
        const rb = b.edhrec_rank ?? 99999;
        if (ra !== rb) return ra - rb;
        return a.name.localeCompare(b.name);
      }
      case "price": {
        const pa = getPrice(a);
        const pb = getPrice(b);
        if (pa !== pb) return pb - pa; // descending
        return a.name.localeCompare(b.name);
      }
      case "decks": {
        const da = a.inclusion_rate ?? 0;
        const db = b.inclusion_rate ?? 0;
        if (da !== db) return db - da; // descending
        return a.name.localeCompare(b.name);
      }
      default:
        return 0;
    }
  });
}

// ── Grouping ──

interface CardGroup {
  key: string;
  title: string;
  variant: "keep" | "pending" | "fail";
  cards: MTGCard[];
}

const COLOR_LABELS: Record<string, string> = {
  B: "Black",
  G: "Green",
  R: "Red",
  U: "Blue",
  W: "White",
};

function groupCards(
  allCards: MTGCard[],
  groupBy: GroupBy,
  sortBy: SortField,
  keepCards: MTGCard[],
  pendingCards: MTGCard[],
  failCards: MTGCard[]
): CardGroup[] {
  switch (groupBy) {
    case "category":
      return [
        { key: "keep", title: "Keep / Staples", variant: "keep", cards: applySortField(keepCards, sortBy) },
        { key: "pending", title: "Pending / Review", variant: "pending", cards: applySortField(pendingCards, sortBy) },
        { key: "fail", title: "Fail / Cut", variant: "fail", cards: applySortField(failCards, sortBy) },
      ];

    case "color": {
      const colorMap = new Map<string, MTGCard[]>();
      for (const card of allCards) {
        const color = card.color_identity || "Colorless";
        if (!colorMap.has(color)) colorMap.set(color, []);
        colorMap.get(color)!.push(card);
      }
      const colorOrder = ["W", "U", "B", "R", "G"];
      const sortedKeys = [...colorMap.keys()].sort((a, b) => {
        const ia = colorOrder.indexOf(a);
        const ib = colorOrder.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
      });
      return sortedKeys.map((color) => ({
        key: `color-${color}`,
        title: COLOR_LABELS[color] || color,
        variant: "keep" as const,
        cards: applySortField(colorMap.get(color)!, sortBy),
      }));
    }

    case "type": {
      const typeMap = new Map<string, MTGCard[]>();
      for (const card of allCards) {
        const type = getPrimaryType(card);
        if (!typeMap.has(type)) typeMap.set(type, []);
        typeMap.get(type)!.push(card);
      }
      const typeOrder = [...PRIMARY_TYPES, "Other"];
      const sortedKeys = [...typeMap.keys()].sort((a, b) => {
        return typeOrder.indexOf(a) - typeOrder.indexOf(b);
      });
      return sortedKeys.map((type) => ({
        key: `type-${type}`,
        title: type,
        variant: "keep" as const,
        cards: applySortField(typeMap.get(type)!, sortBy),
      }));
    }

    case "none":
      return [
        { key: "all", title: "All Cards", variant: "keep", cards: applySortField(allCards, sortBy) },
      ];

    default:
      return [];
  }
}

// ── Dashboard ──

export function Dashboard() {
  const { stats, filename } = useCollectionStore();
  const allCards = useCollectionStore((s) => s.allCards);
  const keepCards = useKeepCards();
  const pendingCards = usePendingCards();
  const failCards = useFailCards();
  const { resolve } = useSwipeResolve();

  const [sortBy, setSortBy] = useState<SortField>("name");
  const [groupByVal, setGroupBy] = useState<GroupBy>("category");

  const groups = useMemo(
    () => groupCards(allCards, groupByVal, sortBy, keepCards, pendingCards, failCards),
    [allCards, groupByVal, sortBy, keepCards, pendingCards, failCards]
  );

  return (
    <div className="flex flex-col gap-12">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl text-foreground uppercase tracking-tighter leading-none">
            Collection Vault
          </h1>
          {filename && (
            <p className="font-mono text-xs text-foreground-muted mt-2 uppercase tracking-wider">
              {filename}
            </p>
          )}
        </div>
      </div>

      {/* Main grid: Stats + Swiper */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 items-start">
        {/* Left column: Stats */}
        <div className="flex flex-col gap-8">
          <StatsChart stats={stats} />

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Keep", value: stats.Keep, color: "text-keep" },
              { label: "Pending", value: stats.Pending, color: "text-pending" },
              { label: "Fail", value: stats.Fail, color: "text-fail" },
            ].map((s) => (
              <div key={s.label} className="bg-surface-low p-4">
                <span className="font-mono text-[10px] text-foreground-muted uppercase tracking-widest block">
                  {s.label}
                </span>
                <span className={`font-mono text-3xl font-bold ${s.color}`}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Swiper */}
        {pendingCards.length > 0 && (
          <div className="bg-surface-low p-6">
            <h2 className="font-display text-xl text-pending uppercase tracking-tight mb-6">
              Review Pending
            </h2>
            <PendingSwiper cards={pendingCards} onResolve={resolve} />
          </div>
        )}
      </div>

      {/* Sort / Group toolbar */}
      <SortBar
        sortBy={sortBy}
        groupBy={groupByVal}
        onSortChange={setSortBy}
        onGroupChange={setGroupBy}
      />

      {/* Card lists */}
      <div className="flex flex-col gap-4">
        {groups.map((group, i) => (
          <CardList
            key={group.key}
            title={group.title}
            cards={group.cards}
            variant={group.variant}
            defaultOpen={i === 0}
            preSorted
          />
        ))}
      </div>
    </div>
  );
}
