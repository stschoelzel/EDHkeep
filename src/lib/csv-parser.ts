import Papa from "papaparse";
import type { MTGCard, CSVFormat } from "./types";
import { FORMAT_SIGNATURES } from "./constants";

/** Detect CSV format from header row */
function detectFormat(headers: string[]): CSVFormat {
  const h = new Set(headers.map((s) => s.trim()));

  for (const [format, sigs] of Object.entries(FORMAT_SIGNATURES)) {
    if (sigs.every((s) => h.has(s))) {
      return format as CSVFormat;
    }
  }

  // Fallback: if it has Name + Edition, treat as Moxfield
  if (h.has("Name") && h.has("Edition")) return "moxfield";

  return "generic";
}

/** Column mappings per format → MTGCard fields */
const COLUMN_MAP: Record<
  CSVFormat,
  { name: string; set: string; collector_number: string }
> = {
  moxfield: { name: "Name", set: "Edition", collector_number: "Collector Number" },
  dragonshield: { name: "Card Name", set: "Set Code", collector_number: "Card Number" },
  manabox: { name: "Name", set: "Set code", collector_number: "Collector Number" },
  deckbox: { name: "Name", set: "Edition", collector_number: "Card Number" },
  generic: { name: "Name", set: "Set", collector_number: "Number" },
};

/**
 * Parse a CSV string into MTGCard stubs.
 * Auto-detects format from headers.
 */
export function parseCSV(content: string): MTGCard[] {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (!result.data.length) return [];

  const headers = result.meta.fields ?? [];
  const format = detectFormat(headers);
  const cols = COLUMN_MAP[format];

  const cards: MTGCard[] = [];

  for (const row of result.data) {
    const name = row[cols.name]?.trim();
    if (!name) continue;

    cards.push({
      name,
      set_code: row[cols.set]?.trim() || "UNK",
      collector_number: row[cols.collector_number]?.trim() || "0",
      type_line: "Unknown",
      category: "Pending",
    });
  }

  return cards;
}
