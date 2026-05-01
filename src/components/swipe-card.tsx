"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
  type Easing,
} from "framer-motion";
import type { MTGCard, SwipeDirection } from "@/lib/types";
import { SWIPE_THRESHOLD_PX, SWIPE_THRESHOLD_VEL } from "@/lib/constants";

interface SwipeCardProps {
  card: MTGCard;
  onSwipe: (direction: SwipeDirection) => void;
  isTop: boolean;
  exitDirection?: SwipeDirection | null;
}

export function SwipeCard({
  card,
  onSwipe,
  isTop,
  exitDirection,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  const keepOpacity = useTransform(x, [-200, -50, 0], [0.4, 0.1, 0]);
  const failOpacity = useTransform(x, [0, 50, 200], [0, 0.1, 0.4]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;

    if (offset.x < -SWIPE_THRESHOLD_PX || velocity.x < -SWIPE_THRESHOLD_VEL) {
      onSwipe("left");
    } else if (
      offset.x > SWIPE_THRESHOLD_PX ||
      velocity.x > SWIPE_THRESHOLD_VEL
    ) {
      onSwipe("right");
    } else if (
      offset.y < -SWIPE_THRESHOLD_PX ||
      velocity.y < -SWIPE_THRESHOLD_VEL
    ) {
      onSwipe("up");
    }
  };

  const easeIn: Easing = "easeIn";

  const getExitAnimation = () => {
    switch (exitDirection) {
      case "left":
        return {
          x: -500,
          rotate: -25,
          scale: 0.6,
          opacity: 0,
          transition: { duration: 0.45, ease: easeIn },
        };
      case "right":
        return {
          x: 500,
          rotate: 25,
          scale: 0.6,
          opacity: 0,
          transition: { duration: 0.45, ease: easeIn },
        };
      case "up":
        return {
          y: 20,
          scale: 0.88,
          opacity: 0,
          transition: { duration: 0.18, ease: easeIn },
        };
      default:
        return {
          x: 300,
          opacity: 0,
          transition: { duration: 0.3 },
        };
    }
  };

  const imageUrl =
    card.image_uris?.normal ||
    card.image_uris?.small ||
    (card.set_code &&
    card.set_code !== "UNK" &&
    card.collector_number &&
    card.collector_number !== "0"
      ? `https://api.scryfall.com/cards/${card.set_code.toLowerCase()}/${encodeURIComponent(card.collector_number)}?format=image&version=normal`
      : null);

  return (
    <motion.div
      className={`absolute inset-0 ${isTop ? "z-10 cursor-grab active:cursor-grabbing" : "z-0"}`}
      style={isTop ? { x, y, rotate } : {}}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDragEnd={isTop ? handleDragEnd : undefined}
      initial={isTop ? { scale: 1 } : { scale: 0.95, y: 10 }}
      animate={isTop ? { scale: 1 } : { scale: 0.95, y: 10 }}
      exit={getExitAnimation()}
    >
      <div className="relative bg-surface-high overflow-hidden h-full flex flex-col">
        {/* Keep glow overlay */}
        {isTop && (
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              opacity: keepOpacity,
              boxShadow: "inset 0 0 60px #89f0cb",
            }}
          />
        )}
        {/* Fail glow overlay */}
        {isTop && (
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              opacity: failOpacity,
              boxShadow: "inset 0 0 60px #fd6ed0",
            }}
          />
        )}

        {/* Directional labels */}
        {isTop && (
          <>
            <motion.div
              className="absolute top-4 left-4 z-30 font-display text-keep text-xl uppercase tracking-wider"
              style={{ opacity: keepOpacity }}
            >
              Keep
            </motion.div>
            <motion.div
              className="absolute top-4 right-4 z-30 font-display text-fail text-xl uppercase tracking-wider"
              style={{ opacity: failOpacity }}
            >
              Fail
            </motion.div>
          </>
        )}

        {/* Card image — top section */}
        <div className="relative flex-1 min-h-0 items-center justify-center flex p-2">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={card.name}
              className="h-full object-contain aspect-[63.5/88.9] rounded-[5%] shadow-md"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-surface-low flex items-center justify-center">
              <span className="font-mono text-xs text-foreground-muted">
                No image
              </span>
            </div>
          )}
        </div>

        {/* Info bar — bottom section */}
        <div className="bg-surface-low px-4 py-3 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base text-foreground leading-tight tracking-tight truncate">
              {card.name}
            </h3>
            <span className="font-mono text-[10px] text-foreground-muted uppercase">
              {card.set_code}
            </span>
            {(card.quantity ?? 1) > 1 && (
              <span className="ml-2 font-mono text-[10px] text-foreground-muted">
                x{card.quantity}
              </span>
            )}
          </div>

          {card.edhrec_rank && (
            <div className="text-right flex-shrink-0">
              <span className="font-mono text-[10px] text-foreground-muted uppercase tracking-widest block">
                Rank
              </span>
              <span className="font-mono text-base text-keep font-bold">
                #{card.edhrec_rank}
              </span>
            </div>
          )}

          {card.color_identity && (
            <div className="text-right flex-shrink-0">
              <span className="font-mono text-[10px] text-foreground-muted uppercase tracking-widest block">
                Color
              </span>
              <span className="font-mono text-sm text-foreground">
                {card.color_identity}
              </span>
            </div>
          )}

          {card.inclusion_rate != null && (
            <div className="text-right flex-shrink-0">
              <span className="font-mono text-[10px] text-foreground-muted uppercase tracking-widest block">
                Decks
              </span>
              <span className="font-mono text-sm text-foreground">
                {card.inclusion_rate.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
