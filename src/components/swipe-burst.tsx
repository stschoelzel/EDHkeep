"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

function generateParticles(count: number, spread: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
    const distance = spread * 0.3 + Math.random() * spread * 0.7;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 8 + Math.random() * 22,
      delay: Math.random() * 0.12,
      duration: 0.35 + Math.random() * 0.3,
    };
  });
}

interface SwipeBurstProps {
  direction: "left" | "right" | null;
  trigger: number;
}

export function SwipeBurst({ direction, trigger }: SwipeBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  const color = direction === "left" ? "#89f0cb" : "#fd6ed0";

  useEffect(() => {
    if (trigger > 0 && direction) {
      setParticles(generateParticles(16, 160));
      const timer = setTimeout(() => setParticles([]), 900);
      return () => clearTimeout(timer);
    }
  }, [trigger, direction]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={`${trigger}-${p.id}`}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: color,
            boxShadow: `0 0 ${p.size * 0.8}px ${color}50`,
          }}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1.6, 0],
            x: p.x,
            y: p.y,
            opacity: [1, 0.75, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
