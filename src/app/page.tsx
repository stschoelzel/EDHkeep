"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { UploadArea } from "@/components/upload-area";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      {/* Wordmark */}
      <div className="mb-16 text-center">
        <h1 className="font-display text-6xl sm:text-8xl text-foreground uppercase tracking-tighter leading-none">
          EDHKeep
        </h1>
        <p className="font-mono text-xs text-foreground-muted mt-3 uppercase tracking-[0.3em]">
          Commander Collection Vault
        </p>
      </div>

      {/* Upload */}
      <UploadArea />

      <Link
        href="/top-cards"
        className="mt-8 inline-flex items-center gap-2 border border-ghost-border px-4 py-2 font-mono text-xs uppercase tracking-wider text-foreground-muted transition-colors hover:border-keep hover:text-keep"
      >
        <BarChart3 className="h-4 w-4" />
        Top card curve
      </Link>

      {/* Footer credit */}
      <footer className="mt-auto pt-16">
        <p className="font-mono text-[10px] text-foreground-muted/50 tracking-wider">
          Powered by EDHRec + Scryfall
        </p>
      </footer>
    </main>
  );
}
