// ── Card Model ──

export type CardCategory = "Keep" | "Pending" | "Fail";

export interface MTGCard {
  name: string;
  set_code: string;
  collector_number: string;
  mana_cost?: string;
  type_line: string;
  image_uris?: Record<string, string>;
  prices?: Record<string, string | null>;
  edhrec_rank?: number;
  inclusion_rate?: number;
  edhrec_url?: string;
  color_identity?: string;
  category: CardCategory;
}

// ── EDHRec Types ──

export type EDHRecColor = "w" | "u" | "b" | "r" | "g";

export interface EDHRecCardView {
  name: string;
  num_decks: number;
  url: string;
}

export interface EDHRecColorResult {
  color: EDHRecColor;
  cards: EDHRecCardView[];
  elbowIndex: number;
}

// ── API Request/Response ──

export interface CategoryStats {
  Keep: number;
  Pending: number;
  Fail: number;
}

export interface UploadResponse {
  filename: string;
  total_cards: number;
  stats: CategoryStats;
  all_cards: MTGCard[];
}

// ── SSE Streaming ──

export interface ProgressEvent {
  type: "progress";
  step: string;
  detail: string;
  percent: number;
}

export interface ResultEvent {
  type: "result";
  data: UploadResponse;
}

export type StreamEvent = ProgressEvent | ResultEvent;

// ── CSV ──

export type CSVFormat =
  | "moxfield"
  | "dragonshield"
  | "manabox"
  | "deckbox"
  | "generic";

export type ExportFormat = "moxfield" | "dragonshield" | "manabox";

// ── Swipe ──

export type SwipeDirection = "left" | "right" | "up";
