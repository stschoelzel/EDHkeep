"use client";

import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TopCardCategory = "Keep" | "Pending" | "Fail";

export interface TopCardGraphPoint {
  rank: number;
  name: string;
  category: TopCardCategory;
  numDecks: number;
  inclusionRate: number;
}

interface TopCardsGraphProps {
  data: TopCardGraphPoint[];
  keepEndRank: number;
  pendingEndRank: number;
}

const CATEGORY_COLORS: Record<TopCardCategory, string> = {
  Keep: "#89f0cb",
  Pending: "#f6e05e",
  Fail: "#fd6ed0",
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function tooltipContent({
  active,
  payload,
}: {
  active?: unknown;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}) {
  if (!active || !payload?.[0]) return null;

  const point = payload[0].payload as TopCardGraphPoint | undefined;
  if (!point) return null;

  return (
    <div className="border border-ghost-border bg-surface-low px-3 py-2 font-mono text-xs shadow-2xl">
      <div className="text-foreground">#{point.rank} {point.name}</div>
      <div className="mt-1 text-foreground-muted">
        {formatPercent(point.inclusionRate)} inclusion
      </div>
      <div className="mt-1 text-foreground-muted">
        {formatNumber(point.numDecks)} decks
      </div>
      <div
        className="mt-1 uppercase tracking-wider"
        style={{ color: CATEGORY_COLORS[point.category] }}
      >
        {point.category}
      </div>
    </div>
  );
}

export function TopCardsGraph({
  data,
  keepEndRank,
  pendingEndRank,
}: TopCardsGraphProps) {
  return (
    <div className="h-[420px] w-full">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 28, bottom: 34, left: 12 }}
          responsive
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            <linearGradient id="deckCurve" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#89f0cb" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#89f0cb" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(232, 230, 227, 0.1)" vertical={false} />
          <ReferenceArea
            x1={1}
            x2={keepEndRank}
            fill={CATEGORY_COLORS.Keep}
            fillOpacity={0.08}
          />
          <ReferenceArea
            x1={keepEndRank + 1}
            x2={pendingEndRank}
            fill={CATEGORY_COLORS.Pending}
            fillOpacity={0.1}
          />
          <ReferenceArea
            x1={pendingEndRank + 1}
            x2={data.length}
            fill={CATEGORY_COLORS.Fail}
            fillOpacity={0.06}
          />

          <XAxis
            dataKey="rank"
            minTickGap={28}
            stroke="#9a9897"
            tick={{ fill: "#9a9897", fontFamily: "Illinois Mono, monospace", fontSize: 11 }}
            tickLine={false}
            type="number"
            domain={[1, data.length]}
            label={{
              value: "EDHRec rank",
              position: "insideBottom",
              offset: -20,
              fill: "#9a9897",
              fontSize: 11,
              fontFamily: "Illinois Mono, monospace",
            }}
          />
          <YAxis
            stroke="#9a9897"
            tick={{ fill: "#9a9897", fontFamily: "Illinois Mono, monospace", fontSize: 11 }}
            tickFormatter={(value) => formatPercent(Number(value))}
            tickLine={false}
            width={64}
          />
          <Tooltip content={tooltipContent} cursor={{ stroke: "#e8e6e3", strokeOpacity: 0.25 }} />

          <ReferenceLine
            x={keepEndRank + 1}
            stroke={CATEGORY_COLORS.Pending}
            strokeDasharray="6 6"
            label={{
              value: `pending #${keepEndRank + 1}`,
              position: "top",
              fill: CATEGORY_COLORS.Pending,
              fontSize: 11,
              fontFamily: "Illinois Mono, monospace",
            }}
          />
          <ReferenceLine
            x={pendingEndRank + 1}
            stroke={CATEGORY_COLORS.Fail}
            strokeDasharray="4 8"
            label={{
              value: "fail",
              position: "top",
              fill: CATEGORY_COLORS.Fail,
              fontSize: 11,
              fontFamily: "Illinois Mono, monospace",
            }}
          />

          <Area
            type="monotone"
            dataKey="inclusionRate"
            stroke="#89f0cb"
            strokeWidth={2}
            fill="url(#deckCurve)"
            dot={false}
            isAnimationActive={false}
          />
          <Brush
            dataKey="rank"
            height={24}
            travellerWidth={8}
            stroke="#4a484a"
            fill="#1c1b1b"
            tickFormatter={(rank) => `#${rank}`}
          />
        </AreaChart>
    </div>
  );
}
