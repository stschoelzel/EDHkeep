"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCollectionStore } from "@/stores/collection-store";
import type { ProgressEvent, StreamEvent } from "@/lib/types";

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

  const upload = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setEvents([]);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok || !res.body) {
          setError(`Upload failed: ${res.statusText}`);
          setIsLoading(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE frames (split on double newline)
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const line = frame.trim();
            if (!line.startsWith("data: ")) continue;

            const json = line.slice(6);
            try {
              const event = JSON.parse(json) as StreamEvent;

              if (event.type === "progress") {
                setEvents((prev) => [...prev, event]);
              } else if (event.type === "result") {
                setAnalysisResult(event.data);
                setIsLoading(false);
                router.push("/dashboard");
                return;
              }
            } catch {
              // Skip malformed frames
            }
          }
        }

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setIsLoading(false);
      }
    },
    [setAnalysisResult, router]
  );

  return { isLoading, events, error, upload };
}
