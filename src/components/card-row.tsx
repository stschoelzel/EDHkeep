import { ExternalLink } from "lucide-react";
import type { MTGCard } from "@/lib/types";

interface CardRowProps {
  card: MTGCard;
}

export function CardRow({ card }: CardRowProps) {
  const scryfallUrl = `https://scryfall.com/search?q=${encodeURIComponent(card.name)}`;
  const edhrecUrl =
    card.edhrec_url ||
    `https://edhrec.com/cards/${card.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  return (
    <div className="group flex items-center gap-4 py-3 px-4 hover:bg-surface-high transition-colors">
      {/* Rank */}
      <div className="w-12 flex-shrink-0">
        {card.edhrec_rank ? (
          <span className="font-mono text-sm text-keep font-bold">
            #{card.edhrec_rank}
          </span>
        ) : (
          <span className="font-mono text-sm text-foreground-muted">--</span>
        )}
      </div>

      {/* Name + Set + Color */}
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm font-body truncate">
          {card.name}
        </p>
        <div className="flex gap-2 items-center">
          <span className="font-mono text-[10px] text-foreground-muted uppercase">
            {card.set_code}
          </span>
          {(card.quantity ?? 1) > 1 && (
            <span className="font-mono text-[10px] text-foreground-muted">
              x{card.quantity}
            </span>
          )}
          {card.color_identity && (
            <span className="font-mono text-[10px] text-foreground-muted">
              {card.color_identity}
            </span>
          )}
        </div>
      </div>

      {/* Inclusion / Decks */}
      <div className="w-20 text-right flex-shrink-0">
        {card.inclusion_rate != null ? (
          <span className="font-mono text-xs text-foreground-muted">
            {card.inclusion_rate.toLocaleString()} decks
          </span>
        ) : null}
      </div>

      {/* Links */}
      <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={edhrecUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground-muted hover:text-keep transition-colors"
          title="EDHRec"
        >
          <ExternalLink size={14} />
        </a>
        <a
          href={scryfallUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground-muted hover:text-keep transition-colors"
          title="Scryfall"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
