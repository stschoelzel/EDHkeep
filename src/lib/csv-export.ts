import type { MTGCard, ExportFormat } from "./types";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCSV(headers: string[], rows: string[][]): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCSV).join(","));
  }
  return lines.join("\n");
}

function exportMoxfield(cards: MTGCard[]): string {
  const headers = [
    "Count",
    "Tradelist Count",
    "Name",
    "Edition",
    "Condition",
    "Language",
    "Foil",
    "Tag",
    "Collector Number",
  ];
  const rows = cards.map((c) => [
    String(c.quantity ?? 1),
    "0",
    c.name,
    c.set_code,
    "Near Mint",
    "English",
    "",
    c.category,
    c.collector_number,
  ]);
  return toCSV(headers, rows);
}

function exportDragonShield(cards: MTGCard[]): string {
  const headers = ["Card Name", "Set Code", "Quantity", "Card Number"];
  const rows = cards.map((c) => [
    c.name,
    c.set_code,
    String(c.quantity ?? 1),
    c.collector_number,
  ]);
  return toCSV(headers, rows);
}

function exportManaBox(cards: MTGCard[]): string {
  const headers = ["Name", "Set code", "Quantity", "Collector Number"];
  const rows = cards.map((c) => [
    c.name,
    c.set_code,
    String(c.quantity ?? 1),
    c.collector_number,
  ]);
  return toCSV(headers, rows);
}

const EXPORTERS: Record<ExportFormat, (cards: MTGCard[]) => string> = {
  moxfield: exportMoxfield,
  dragonshield: exportDragonShield,
  manabox: exportManaBox,
};

/** Generate a CSV string for the given export format */
export function generateExportCSV(
  cards: MTGCard[],
  format: ExportFormat
): string {
  return EXPORTERS[format](cards);
}

/** Trigger a browser download of the CSV */
export function downloadCSV(
  cards: MTGCard[],
  format: ExportFormat,
  filename?: string
): void {
  const csv = generateExportCSV(cards, format);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? `edhkeep_export_${format}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
