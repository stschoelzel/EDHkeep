"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCollectionStore } from "@/stores/collection-store";
import { Dashboard } from "@/components/dashboard";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const allCards = useCollectionStore((s) => s.allCards);
  const reset = useCollectionStore((s) => s.reset);

  // Redirect to home if no data
  useEffect(() => {
    if (allCards.length === 0) {
      router.replace("/");
    }
  }, [allCards.length, router]);

  if (allCards.length === 0) {
    return null;
  }

  const handleReset = () => {
    reset();
    router.push("/");
  };

  return (
    <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <a href="/" className="font-display text-xl text-foreground uppercase tracking-tighter">
          EDHKeep
        </a>
        <Button variant="ghost" onClick={handleReset}>
          <RotateCcw size={14} className="mr-2 inline" />
          New Analysis
        </Button>
      </div>

      <Dashboard />
    </main>
  );
}
