import type { EDHRecColor } from "./types";

export const COLORS: EDHRecColor[] = [
  "w",
  "u",
  "b",
  "r",
  "g",
  "multicolor",
  "colorless",
];

export const COLOR_NAME: Record<EDHRecColor, string> = {
  w: "white",
  u: "blue",
  b: "black",
  r: "red",
  g: "green",
  multicolor: "multicolor",
  colorless: "colorless",
};

export const COLOR_DISPLAY: Record<EDHRecColor, string> = {
  w: "White",
  u: "Blue",
  b: "Black",
  r: "Red",
  g: "Green",
  multicolor: "Multicolor",
  colorless: "Colorless",
};

/** Buffer zone size beyond the elbow cutoff for Pending cards */
export const PENDING_BUFFER = 50;

/** EDHRec cache TTL in milliseconds (1 hour) */
export const EDHREC_CACHE_TTL = 60 * 60 * 1000;

/** Scryfall batch size limit */
export const SCRYFALL_BATCH_SIZE = 75;

/** Scryfall rate limit delay between batches (ms) */
export const SCRYFALL_DELAY = 100;

/** Scryfall cache TTL in milliseconds (24 hours — card data changes rarely) */
export const SCRYFALL_CACHE_TTL = 24 * 60 * 60 * 1000;

/** CSV format detection signatures */
export const FORMAT_SIGNATURES = {
  moxfield: ["Tradelist Count", "Edition"],
  dragonshield: ["Folder Name", "Card Name"],
  manabox: ["Binder Name", "Scryfall ID"],
  deckbox: ["Edition Id"],
} as const;

/** Swipe gesture thresholds */
export const SWIPE_THRESHOLD_PX = 100;
export const SWIPE_THRESHOLD_VEL = 500;
