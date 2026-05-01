"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCollectionStore } from "@/stores/collection-store";
import { parseCSV } from "@/lib/csv-parser";
import { categorizeCollection } from "@/lib/categorize";
import { coalesceGameplayCards } from "@/lib/card-identity";
import { enrichWithScryfall } from "@/lib/scryfall-client";
import type { ProgressEvent, CategoryStats, UploadResponse } from "@/lib/types";

interface UseAnalysisReturn {
  isLoading: boolean;
  events: ProgressEvent[];
  error: string | null;
  upload: (file: File) => Promise<void>;
}

export function useAnalysis(): UseAnalysisReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const setAnalysisResult = useCollectionStore((s) => s.setAnalysisResult);
  const router = useRouter();

  const pushEvent = (step: string, detail: string, percent: number) => {
    const event: ProgressEvent = { type: "progress", step, detail, percent };
    setEvents((prev) => [...prev, event]);
  };

  const upload = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setEvents([]);
      setError(null);

      try {
        // Step 1: Read & parse CSV (all in-browser)
        pushEvent("parsing", `Parsing ${file.name}...`, 5);
        const content = await file.text();
        const cards = parseCSV(content);

        if (cards.length === 0) {
          pushEvent("parsing", "No cards found in CSV", 100);
          const result: UploadResponse = {
            filename: file.name,
            total_cards: 0,
            stats: { Keep: 0, Pending: 0, Fail: 0 },
            all_cards: [],
          };
          setAnalysisResult(result);
          setIsLoading(false);
          router.push("/dashboard");
          return;
        }

        pushEvent(
          "parsing",
          `Parsed ${cards.length} cards from ${file.name}`,
          10,
        );

        // Step 2: Enrich first so print variants can collapse by oracle_id.
        pushEvent("enriching", "Fetching card identities and images from Scryfall...", 35);
        const enrichedCards = await enrichWithScryfall(cards);
        const gameplayCards = coalesceGameplayCards(enrichedCards);

        // Step 3: Load generated EDHRec data + categorize
        const categorized = await categorizeCollection(gameplayCards, (p) => {
          pushEvent(p.step, p.detail, p.percent);
        });

        pushEvent("complete", "Analysis complete", 95);

        // Build stats
        const stats: CategoryStats = { Keep: 0, Pending: 0, Fail: 0 };
        for (const card of categorized) {
          stats[card.category]++;
        }

        const result: UploadResponse = {
          filename: file.name,
          total_cards: categorized.length,
          stats,
          all_cards: categorized,
        };

        setAnalysisResult(result);
        setIsLoading(false);
        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
        setIsLoading(false);
      }
    },
    [setAnalysisResult, router],
  );

  return { isLoading, events, error, upload };
}
