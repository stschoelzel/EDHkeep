import { NextRequest } from "next/server";
import { parseCSV } from "@/lib/csv-parser";
import { categorizeCollection } from "@/lib/categorize";
import { enrichWithScryfall } from "@/lib/scryfall-client";
import type { UploadResponse, CategoryStats } from "@/lib/types";

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const filename = file.name;
  const content = await file.text();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(new TextEncoder().encode(sseEvent(data)));
      };

      try {
        // Step 1: Parse CSV
        send({
          type: "progress",
          step: "parsing",
          detail: `Parsing ${filename}...`,
          percent: 5,
        });

        const cards = parseCSV(content);

        if (cards.length === 0) {
          send({
            type: "progress",
            step: "parsing",
            detail: "No cards found in CSV",
            percent: 100,
          });
          const result: UploadResponse = {
            filename,
            total_cards: 0,
            stats: { Keep: 0, Pending: 0, Fail: 0 },
            all_cards: [],
          };
          send({ type: "result", data: result });
          controller.close();
          return;
        }

        send({
          type: "progress",
          step: "parsing",
          detail: `Parsed ${cards.length} cards from ${filename}`,
          percent: 10,
        });

        // Step 2 & 3: Fetch EDHRec + Categorize (progress emitted from categorize)
        const categorized = await categorizeCollection(cards, (p) => {
          send({ type: "progress", ...p });
        });

        // Step 4: Enrich with Scryfall
        send({
          type: "progress",
          step: "enriching",
          detail: "Fetching card images from Scryfall...",
          percent: 80,
        });

        const enriched = await enrichWithScryfall(categorized);

        send({
          type: "progress",
          step: "complete",
          detail: "Analysis complete",
          percent: 95,
        });

        // Build stats
        const stats: CategoryStats = { Keep: 0, Pending: 0, Fail: 0 };
        for (const card of enriched) {
          stats[card.category]++;
        }

        // Final result
        const result: UploadResponse = {
          filename,
          total_cards: enriched.length,
          stats,
          all_cards: enriched,
        };

        send({ type: "result", data: result });
      } catch (err) {
        send({
          type: "error",
          detail: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
