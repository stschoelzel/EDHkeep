"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText } from "lucide-react";
import { useAnalysis } from "@/hooks/use-analysis";
import { ProgressTracker } from "./progress-tracker";

export function UploadArea() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isLoading, events, error, upload } = useAnalysis();

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        return;
      }
      upload(file);
    },
    [upload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (isLoading) {
    return <ProgressTracker events={events} />;
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`w-full cursor-pointer transition-all ${
          isDragging
            ? "bg-keep/5 glow-keep-strong"
            : "bg-surface-low hover:bg-surface-high"
        } rounded-none p-16 flex flex-col items-center gap-6`}
      >
        <div className="text-keep">
          {isDragging ? (
            <FileText size={48} strokeWidth={1} />
          ) : (
            <Upload size={48} strokeWidth={1} />
          )}
        </div>

        <div className="text-center">
          <p className="font-display text-2xl text-foreground tracking-tight">
            {isDragging ? "DROP CSV" : "UPLOAD COLLECTION"}
          </p>
          <p className="text-foreground-muted text-sm mt-2 font-body">
            Moxfield, DragonShield, ManaBox, or DeckBox format
          </p>
        </div>

        <div className="border-b border-ghost-border w-32 mt-2" />

        <p className="font-mono text-xs text-foreground-muted tracking-wider uppercase">
          .csv files only
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {error && (
        <div className="bg-fail/10 text-fail font-mono text-sm px-4 py-3 w-full rounded-none">
          {error}
        </div>
      )}
    </div>
  );
}
