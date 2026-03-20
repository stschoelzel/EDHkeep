import { NextRequest, NextResponse } from "next/server";
import { SCRYFALL_BATCH_SIZE, SCRYFALL_DELAY } from "@/lib/constants";

interface ScryfallIdentifier {
  name: string;
  set?: string;
  collector_number?: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST /api/scryfall
 * Batch-enriches cards via Scryfall's /cards/collection endpoint.
 * Handles batching (75 max) and rate limiting.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as { cards: ScryfallIdentifier[] };

  if (!body.cards?.length) {
    return NextResponse.json({ cards: [] });
  }

  const allResults: unknown[] = [];

  for (let i = 0; i < body.cards.length; i += SCRYFALL_BATCH_SIZE) {
    if (i > 0) await delay(SCRYFALL_DELAY);

    const batch = body.cards.slice(i, i + SCRYFALL_BATCH_SIZE);

    const res = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers: batch }),
    });

    if (res.ok) {
      const data = (await res.json()) as { data: unknown[] };
      allResults.push(...(data.data ?? []));
    }
  }

  return NextResponse.json({ cards: allResults });
}
