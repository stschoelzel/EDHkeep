import type { CardCategory } from "@/lib/types";

interface BadgeProps {
  category: CardCategory;
  className?: string;
}

const categoryStyles: Record<CardCategory, string> = {
  Keep: "bg-keep text-surface",
  Pending: "bg-pending text-surface",
  Fail: "bg-fail text-surface",
};

export function Badge({ category, className = "" }: BadgeProps) {
  return (
    <span
      className={`rounded-none px-2 py-0.5 text-xs font-mono font-bold uppercase tracking-wider ${categoryStyles[category]} ${className}`}
    >
      {category}
    </span>
  );
}
