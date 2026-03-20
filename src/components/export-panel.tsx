"use client";

import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown } from "lucide-react";
import { downloadCSV } from "@/lib/csv-export";
import type { MTGCard, ExportFormat } from "@/lib/types";

interface ExportPanelProps {
  cards: MTGCard[];
}

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "moxfield", label: "Moxfield" },
  { value: "dragonshield", label: "DragonShield" },
  { value: "manabox", label: "ManaBox" },
];

export function ExportPanel({ cards }: ExportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const handleExport = (format: ExportFormat) => {
    downloadCSV(cards, format);
    setIsOpen(false);
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs text-foreground-muted hover:text-keep transition-colors cursor-pointer uppercase tracking-wider"
      >
        <Download size={12} />
        Export
        <ChevronDown size={10} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 glass rounded-none min-w-[160px]">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleExport(f.value)}
              className="w-full text-left px-4 py-2.5 font-mono text-xs text-foreground hover:bg-surface-high transition-colors cursor-pointer"
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
