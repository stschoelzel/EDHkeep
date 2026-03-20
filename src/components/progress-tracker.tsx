"use client";

import { Check } from "lucide-react";
import { Spinner } from "./ui/spinner";
import type { ProgressEvent } from "@/lib/types";

interface ProgressTrackerProps {
  events: ProgressEvent[];
}

export function ProgressTracker({ events }: ProgressTrackerProps) {
  const latestPercent = events.length > 0 ? events[events.length - 1].percent : 0;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-foreground tracking-tight uppercase">
          Analyzing
        </h2>
        <span className="font-mono text-sm text-keep">{latestPercent}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-surface-high rounded-none overflow-hidden">
        <div
          className="h-full bg-keep transition-all duration-500 ease-out"
          style={{ width: `${latestPercent}%` }}
        />
      </div>

      {/* Step list */}
      <div className="flex flex-col gap-3">
        {events.map((event, i) => {
          const isLatest = i === events.length - 1;
          const isDone = !isLatest;

          return (
            <div
              key={`${event.step}-${i}`}
              className={`flex items-center gap-3 transition-opacity ${
                isDone ? "opacity-50" : "opacity-100"
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {isDone ? (
                  <Check size={14} className="text-keep" />
                ) : (
                  <Spinner size="sm" />
                )}
              </div>
              <span className="font-mono text-xs text-foreground-muted tracking-wide">
                {event.detail}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
