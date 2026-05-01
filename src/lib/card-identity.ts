import type { MTGCard } from "./types";

export function normalizeGameplayName(name: string): string {
  return name.split(" // ")[0].trim().toLowerCase();
}

export function gameplayIdentity(card: Pick<MTGCard, "name" | "oracle_id">): string {
  return card.oracle_id ? `oracle|${card.oracle_id}` : `name|${normalizeGameplayName(card.name)}`;
}

function mergeCard(existing: MTGCard, incoming: MTGCard): MTGCard {
  return {
    ...existing,
    quantity: (existing.quantity ?? 1) + (incoming.quantity ?? 1),
    id: existing.id ?? incoming.id,
    oracle_id: existing.oracle_id ?? incoming.oracle_id,
    mana_cost: existing.mana_cost ?? incoming.mana_cost,
    type_line: existing.type_line !== "Unknown" ? existing.type_line : incoming.type_line,
    image_uris: existing.image_uris ?? incoming.image_uris,
    prices: existing.prices ?? incoming.prices,
    edhrec_rank: existing.edhrec_rank ?? incoming.edhrec_rank,
    inclusion_rate: existing.inclusion_rate ?? incoming.inclusion_rate,
    edhrec_url: existing.edhrec_url ?? incoming.edhrec_url,
    color_identity: existing.color_identity ?? incoming.color_identity,
  };
}

export function coalesceGameplayCards(cards: MTGCard[]): MTGCard[] {
  const byIdentity = new Map<string, MTGCard>();

  for (const card of cards) {
    const key = gameplayIdentity(card);
    const existing = byIdentity.get(key);
    byIdentity.set(
      key,
      existing ? mergeCard(existing, card) : { ...card, quantity: card.quantity ?? 1 },
    );
  }

  return [...byIdentity.values()];
}
