"use client";

export type SortField = "name" | "color" | "type" | "rank" | "price" | "decks";
export type GroupBy = "category" | "color" | "type" | "none";

interface SortBarProps {
  sortBy: SortField;
  groupBy: GroupBy;
  onSortChange: (sort: SortField) => void;
  onGroupChange: (group: GroupBy) => void;
}

const sortOptions: { value: SortField; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "color", label: "Color" },
  { value: "type", label: "Type" },
  { value: "rank", label: "Rank" },
  { value: "price", label: "Price" },
  { value: "decks", label: "Decks" },
];

const groupOptions: { value: GroupBy; label: string }[] = [
  { value: "category", label: "Category" },
  { value: "color", label: "Color" },
  { value: "type", label: "Type" },
  { value: "none", label: "All" },
];

export function SortBar({
  sortBy,
  groupBy,
  onSortChange,
  onGroupChange,
}: SortBarProps) {
  return (
    <div className="flex flex-col gap-3 bg-surface-low px-6 py-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono text-[10px] text-foreground-muted uppercase tracking-widest w-16 flex-shrink-0">
          Sort
        </span>
        <div className="flex gap-1 flex-wrap">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                sortBy === opt.value
                  ? "bg-keep text-surface"
                  : "bg-surface-high text-foreground-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono text-[10px] text-foreground-muted uppercase tracking-widest w-16 flex-shrink-0">
          Group
        </span>
        <div className="flex gap-1 flex-wrap">
          {groupOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onGroupChange(opt.value)}
              className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                groupBy === opt.value
                  ? "bg-keep text-surface"
                  : "bg-surface-high text-foreground-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
