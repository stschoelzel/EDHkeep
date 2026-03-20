"use client";

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

export function Dashboard() {
  const { stats, filename } = useCollectionStore();
  const keepCards = useKeepCards();
  const pendingCards = usePendingCards();
  const failCards = useFailCards();
  const { resolve } = useSwipeResolve();

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

      {/* Card lists */}
      <div className="flex flex-col gap-4">
        <CardList
          title="Keep / Staples"
          cards={keepCards}
          variant="keep"
          defaultOpen
        />
        <CardList
          title="Pending / Review"
          cards={pendingCards}
          variant="pending"
        />
        <CardList title="Fail / Cut" cards={failCards} variant="fail" />
      </div>
    </div>
  );
}
