import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";
import topCardsData from "../../../public/data/edhrec-top-cards.json";
import { TopCardsGraph, type TopCardGraphPoint } from "@/components/top-cards-graph";

type TopCardCategory = "Keep" | "Pending" | "Fail";

interface StaticTopCard {
  rank: number;
  category: TopCardCategory;
  name: string;
  num_decks: number;
  potential_decks: number;
  inclusion_rate: number;
  edhrec_url?: string;
}

interface StaticTopCardsData {
  generated_at: string;
  count: number;
  category_method: string;
  thresholds: {
    keep_inclusion_rate: number;
    pending_inclusion_rate: number;
  };
  source: string;
  cards: StaticTopCard[];
}

const data = topCardsData as StaticTopCardsData;

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function categoryClass(category: TopCardCategory): string {
  switch (category) {
    case "Keep":
      return "text-keep";
    case "Pending":
      return "text-pending";
    case "Fail":
      return "text-fail";
  }
}

export default function TopCardsPage() {
  const graphData: TopCardGraphPoint[] = data.cards.map((card) => ({
    rank: card.rank,
    name: card.name,
    category: card.category,
    numDecks: card.num_decks,
    inclusionRate: card.inclusion_rate,
  }));

  const counts = data.cards.reduce(
    (acc, card) => {
      acc[card.category] += 1;
      return acc;
    },
    { Keep: 0, Pending: 0, Fail: 0 }
  );

  const keepEndRank = counts.Keep;
  const pendingEndRank = counts.Keep + counts.Pending;
  const boundaryCards = data.cards.slice(
    Math.max(0, keepEndRank - 7),
    Math.min(data.cards.length, pendingEndRank + 7)
  );

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-5 border-b border-ghost-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-foreground-muted transition-colors hover:text-keep"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <h1 className="font-display text-4xl uppercase leading-none tracking-tighter text-foreground sm:text-6xl">
              Top Card Curve
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-foreground-muted">
              Static EDHRec yearly top-card data used by collection categorization.
            </p>
          </div>

          <a
            href="/data/edhrec-top-cards.json"
            className="inline-flex items-center gap-2 self-start border border-ghost-border px-3 py-2 font-mono text-xs uppercase tracking-wider text-foreground-muted transition-colors hover:border-keep hover:text-keep sm:self-auto"
          >
            <Database className="h-4 w-4" />
            JSON
          </a>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Metric label="Cards" value={formatNumber(data.count)} />
          <Metric label="Keep Cutoff" value={formatPercent(data.thresholds.keep_inclusion_rate)} tone="keep" />
          <Metric label="Pending Cutoff" value={formatPercent(data.thresholds.pending_inclusion_rate)} tone="pending" />
          <Metric label="Keep" value={formatNumber(counts.Keep)} tone="keep" />
          <Metric label="Pending" value={formatNumber(counts.Pending)} tone="pending" />
          <Metric label="Fail" value={formatNumber(counts.Fail)} tone="fail" />
        </section>

        <section className="border border-ghost-border bg-surface-low p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-mono text-sm uppercase tracking-wider text-foreground">
                Inclusion Rate By Rank
              </h2>
              <p className="mt-2 text-sm text-foreground-muted">
                Keep is inclusion rate &gt;= {formatPercent(data.thresholds.keep_inclusion_rate)}; Pending is &gt;= {formatPercent(data.thresholds.pending_inclusion_rate)}; Fail is below that.
              </p>
            </div>
            <div className="font-mono text-xs uppercase tracking-wider text-foreground-muted">
              Generated {formatDate(data.generated_at)}
            </div>
          </div>

          <TopCardsGraph
            data={graphData}
            keepEndRank={keepEndRank}
            pendingEndRank={pendingEndRank}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="border border-ghost-border bg-surface-low">
            <div className="border-b border-ghost-border px-4 py-3 sm:px-5">
              <h2 className="font-mono text-sm uppercase tracking-wider text-foreground">
                Boundary Cards
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="border-b border-ghost-border font-mono text-[10px] uppercase tracking-wider text-foreground-muted">
                  <tr>
                    <th className="px-4 py-3 font-normal">Rank</th>
                    <th className="px-4 py-3 font-normal">Card</th>
                    <th className="px-4 py-3 font-normal">Category</th>
                    <th className="px-4 py-3 text-right font-normal">Rate</th>
                    <th className="px-4 py-3 text-right font-normal">Decks</th>
                  </tr>
                </thead>
                <tbody>
                  {boundaryCards.map((card) => (
                    <tr key={card.rank} className="border-b border-ghost-border/60 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-foreground-muted">
                        #{card.rank}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {card.edhrec_url ? (
                          <a href={card.edhrec_url} className="transition-colors hover:text-keep">
                            {card.name}
                          </a>
                        ) : (
                          card.name
                        )}
                      </td>
                      <td className={`px-4 py-3 font-mono text-xs uppercase tracking-wider ${categoryClass(card.category)}`}>
                        {card.category}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-foreground-muted">
                        {formatPercent(card.inclusion_rate)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-foreground-muted">
                        {formatNumber(card.num_decks)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="border border-ghost-border bg-surface-low p-5">
            <h2 className="font-mono text-sm uppercase tracking-wider text-foreground">
              Category Rules
            </h2>
            <dl className="mt-5 flex flex-col gap-4 font-mono text-xs">
              <Rule label="Keep" value={`rank <= ${keepEndRank}`} tone="keep" />
              <Rule
                label="Pending"
                value={`${keepEndRank + 1} <= rank <= ${pendingEndRank}`}
                tone="pending"
              />
              <Rule label="Fail" value={`rank >= ${pendingEndRank + 1}`} tone="fail" />
            </dl>
            <p className="mt-5 text-sm text-foreground-muted">
              Categories come from EDHRec inclusion rate, calculated as decks divided by potential decks.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "keep" | "pending" | "fail";
}) {
  const toneClass =
    tone === "keep"
      ? "text-keep"
      : tone === "pending"
        ? "text-pending"
        : tone === "fail"
          ? "text-fail"
          : "text-foreground";

  return (
    <div className="border border-ghost-border bg-surface-low p-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-foreground-muted">
        {label}
      </div>
      <div className={`mt-2 font-mono text-2xl font-bold ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

function Rule({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "keep" | "pending" | "fail";
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={categoryClass(tone === "keep" ? "Keep" : tone === "pending" ? "Pending" : "Fail")}>
        {label}
      </dt>
      <dd className="text-right text-foreground-muted">{value}</dd>
    </div>
  );
}
