"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import type { MTGCard, SwipeDirection } from "@/lib/types";
import { SWIPE_THRESHOLD_PX, SWIPE_THRESHOLD_VEL } from "@/lib/constants";

interface SwipeCardProps {
  card: MTGCard;
  onSwipe: (direction: SwipeDirection) => void;
  isTop: boolean;
}

export function SwipeCard({ card, onSwipe, isTop }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  // Border glow intensity based on drag
  const keepOpacity = useTransform(x, [-200, -50, 0], [0.4, 0.1, 0]);
  const failOpacity = useTransform(x, [0, 50, 200], [0, 0.1, 0.4]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;

    if (
      offset.x < -SWIPE_THRESHOLD_PX ||
      velocity.x < -SWIPE_THRESHOLD_VEL
    ) {
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

  const imageUrl = card.image_uris?.normal || card.image_uris?.small;

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
      exit={{ x: 300, opacity: 0, transition: { duration: 0.3 } }}
    >
      <div className="relative bg-surface-high rounded-none overflow-hidden h-full">
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

        {/* Card image — asymmetric layout: offset left */}
        <div className="flex h-full">
          <div className="w-3/5 relative flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={card.name}
                className="w-full h-full object-cover"
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

          {/* Technical breakdown panel */}
          <div className="flex-1 bg-surface-low p-4 flex flex-col justify-between">
            <div>
              <h3 className="font-display text-lg text-foreground leading-tight tracking-tight">
                {card.name}
              </h3>
              <p className="font-mono text-xs text-foreground-muted mt-1 uppercase">
                {card.set_code}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {card.edhrec_rank && (
                <div>
                  <span className="font-mono text-[10px] text-foreground-muted uppercase tracking-widest">
                    Rank
                  </span>
                  <p className="font-mono text-lg text-keep font-bold">
                    #{card.edhrec_rank}
                  </p>
                </div>
              )}
              {card.color_identity && (
                <div>
                  <span className="font-mono text-[10px] text-foreground-muted uppercase tracking-widest">
                    Color
                  </span>
                  <p className="font-mono text-sm text-foreground">
                    {card.color_identity}
                  </p>
                </div>
              )}
              {card.inclusion_rate != null && (
                <div>
                  <span className="font-mono text-[10px] text-foreground-muted uppercase tracking-widest">
                    Decks
                  </span>
                  <p className="font-mono text-sm text-foreground">
                    {card.inclusion_rate.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
