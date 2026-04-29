import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDHREC_BASE_URL = "https://json.edhrec.com/pages/";
const EDHREC_START_URL = `${EDHREC_BASE_URL}top/year.json`;
const SCRYFALL_COLLECTION_URL = "https://api.scryfall.com/cards/collection";
const OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "public",
  "data",
  "edhrec-top-cards.json"
);

const CARD_LIMIT = Number.parseInt(process.env.EDHREC_CARD_LIMIT || "5000", 10);
const KEEP_RATE_THRESHOLD = Number.parseFloat(process.env.EDHREC_KEEP_RATE || "0.03");
const PENDING_RATE_THRESHOLD = Number.parseFloat(process.env.EDHREC_PENDING_RATE || "0.02");
const SCRYFALL_BATCH_SIZE = 75;
const SCRYFALL_DELAY_MS = 100;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeName(name) {
  return name.split(" // ")[0].trim().toLowerCase();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "EDHkeep static top-card generator",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function getPageCards(data) {
  if (Array.isArray(data.cardviews)) return data.cardviews;

  const cardlists = data.container?.json_dict?.cardlists ?? data.container?.cardlists;
  if (!Array.isArray(cardlists)) return [];

  return cardlists.flatMap((cardlist) =>
    Array.isArray(cardlist.cardviews) ? cardlist.cardviews : []
  );
}

function getMorePath(data) {
  if (typeof data.more === "string") return data.more;

  const cardlists = data.container?.json_dict?.cardlists ?? data.container?.cardlists;
  if (!Array.isArray(cardlists)) return null;

  const nextList = cardlists.find((cardlist) => typeof cardlist.more === "string");
  return nextList?.more ?? null;
}

function buildEdhrecPageUrl(morePath) {
  if (!morePath) return null;
  if (/^https?:\/\//.test(morePath)) return morePath;
  return new URL(morePath.replace(/^\/+/, ""), EDHREC_BASE_URL).toString();
}

async function fetchEdhrecTopCards(limit) {
  const cards = [];
  const seen = new Set();
  let nextUrl = EDHREC_START_URL;

  while (nextUrl && cards.length < limit) {
    console.log(`Fetching EDHRec page: ${nextUrl}`);
    const page = await fetchJson(nextUrl);
    const pageCards = getPageCards(page);

    for (const card of pageCards) {
      if (!card?.name || typeof card.num_decks !== "number") continue;

      const normalized = normalizeName(card.name);
      if (seen.has(normalized)) continue;
      seen.add(normalized);

      cards.push({
        ...card,
        rank: cards.length + 1,
        edhrec_url: card.url ? `https://edhrec.com${card.url}` : "",
      });

      if (cards.length >= limit) break;
    }

    nextUrl = buildEdhrecPageUrl(getMorePath(page));
  }

  return cards;
}

function scryfallIdentifierFor(card) {
  if (typeof card.id === "string" && card.id) return { id: card.id };
  return { name: card.name };
}

function pickScryfallFields(card) {
  if (!card) return null;

  return {
    id: card.id,
    oracle_id: card.oracle_id,
    name: card.name,
    released_at: card.released_at,
    uri: card.uri,
    scryfall_uri: card.scryfall_uri,
    layout: card.layout,
    mana_cost: card.mana_cost,
    cmc: card.cmc,
    type_line: card.type_line,
    oracle_text: card.oracle_text,
    power: card.power,
    toughness: card.toughness,
    colors: card.colors,
    color_identity: card.color_identity,
    keywords: card.keywords,
    legalities: card.legalities,
    games: card.games,
    reserved: card.reserved,
    foil: card.foil,
    nonfoil: card.nonfoil,
    finishes: card.finishes,
    oversized: card.oversized,
    promo: card.promo,
    reprint: card.reprint,
    variation: card.variation,
    set_id: card.set_id,
    set: card.set,
    set_name: card.set_name,
    set_type: card.set_type,
    collector_number: card.collector_number,
    rarity: card.rarity,
    artist: card.artist,
    prices: card.prices,
    image_uris: card.image_uris,
    card_faces: card.card_faces,
  };
}

async function fetchScryfallCards(cards) {
  const enriched = new Map();
  const identifiers = cards.map(scryfallIdentifierFor);

  for (let i = 0; i < identifiers.length; i += SCRYFALL_BATCH_SIZE) {
    if (i > 0) await delay(SCRYFALL_DELAY_MS);

    const batch = identifiers.slice(i, i + SCRYFALL_BATCH_SIZE);
    const response = await fetch(SCRYFALL_COLLECTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "EDHkeep static top-card generator",
      },
      body: JSON.stringify({ identifiers: batch }),
    });

    if (!response.ok) {
      throw new Error(
        `Scryfall batch ${Math.floor(i / SCRYFALL_BATCH_SIZE) + 1} failed: ` +
          `${response.status} ${response.statusText}`
      );
    }

    const body = await response.json();
    const batchCards = body.data ?? [];

    for (const card of batchCards) {
      enriched.set(card.id, pickScryfallFields(card));
      enriched.set(normalizeName(card.name), pickScryfallFields(card));
    }

    console.log(
      `Fetched Scryfall batch ${Math.floor(i / SCRYFALL_BATCH_SIZE) + 1} ` +
        `(${Math.min(i + SCRYFALL_BATCH_SIZE, identifiers.length)}/${identifiers.length})`
    );
  }

  return enriched;
}

async function main() {
  const cards = await fetchEdhrecTopCards(CARD_LIMIT);
  if (cards.length === 0) {
    throw new Error("EDHRec returned no top cards");
  }

  const scryfallCards = await fetchScryfallCards(cards);

  const enrichedCards = cards.map((card, index) => {
    const scryfall = scryfallCards.get(card.id) ?? scryfallCards.get(normalizeName(card.name));
    const inclusionRate =
      typeof card.potential_decks === "number" && card.potential_decks > 0
        ? card.num_decks / card.potential_decks
        : 0;
    const category =
      inclusionRate >= KEEP_RATE_THRESHOLD
        ? "Keep"
        : inclusionRate >= PENDING_RATE_THRESHOLD
          ? "Pending"
          : "Fail";

    return {
      rank: index + 1,
      category,
      name: card.name,
      sanitized: card.sanitized,
      edhrec_url: card.edhrec_url,
      num_decks: card.num_decks,
      potential_decks: card.potential_decks,
      inclusion_rate: inclusionRate,
      inclusion: card.inclusion ?? card.num_decks,
      label: card.label,
      edhrec: card,
      scryfall,
    };
  });

  const payload = {
    generated_at: new Date().toISOString(),
    source: EDHREC_START_URL,
    requested_limit: CARD_LIMIT,
    count: enrichedCards.length,
    category_method: "inclusion_rate_thresholds",
    thresholds: {
      keep_inclusion_rate: KEEP_RATE_THRESHOLD,
      pending_inclusion_rate: PENDING_RATE_THRESHOLD,
    },
    counts: {
      Keep: enrichedCards.filter((card) => card.category === "Keep").length,
      Pending: enrichedCards.filter((card) => card.category === "Pending").length,
      Fail: enrichedCards.filter((card) => card.category === "Fail").length,
    },
    cards: enrichedCards,
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    `Wrote ${enrichedCards.length} cards to ${OUTPUT_PATH}; ` +
      `${payload.counts.Keep} Keep, ${payload.counts.Pending} Pending, ${payload.counts.Fail} Fail`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
