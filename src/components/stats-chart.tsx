"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { CategoryStats } from "@/lib/types";

interface StatsChartProps {
  stats: CategoryStats;
}

const COLORS_MAP = {
  Keep: "#89f0cb",
  Pending: "#f6e05e",
  Fail: "#fd6ed0",
};

export function StatsChart({ stats }: StatsChartProps) {
  const data = [
    { name: "Keep", value: stats.Keep },
    { name: "Pending", value: stats.Pending },
    { name: "Fail", value: stats.Fail },
  ].filter((d) => d.value > 0);

  const total = stats.Keep + stats.Pending + stats.Fail;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLORS_MAP[entry.name as keyof typeof COLORS_MAP]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#1c1b1b",
                border: "none",
                borderRadius: "0px",
                fontFamily: "Illinois Mono, monospace",
                fontSize: "12px",
                color: "#e8e6e3",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold text-foreground">
            {total}
          </span>
          <span className="font-mono text-xs text-foreground-muted uppercase tracking-wider">
            cards
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-none"
              style={{
                background:
                  COLORS_MAP[entry.name as keyof typeof COLORS_MAP],
              }}
            />
            <span className="font-mono text-xs text-foreground-muted">
              {entry.name}
            </span>
            <span className="font-mono text-xs text-foreground font-bold">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
