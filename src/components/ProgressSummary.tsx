"use client";

import type { ChecklistMap } from "@/lib/storage";
import type { OffsetLine } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProgressSummaryProps {
  rawLines: OffsetLine[];
  craftLines: OffsetLine[];
  checklist: ChecklistMap;
  className?: string;
}

function lineDone(prefix: "raw" | "craft", line: OffsetLine, checklist: ChecklistMap) {
  const covered = line.remaining === 0 && line.required > 0;
  return covered || Boolean(checklist[`${prefix}:${line.name}`]);
}

export function ProgressSummary({
  rawLines,
  craftLines,
  checklist,
  className,
}: ProgressSummaryProps) {
  const rawDone = rawLines.filter((line) => lineDone("raw", line, checklist)).length;
  const craftDone = craftLines.filter((line) => lineDone("craft", line, checklist)).length;
  const total = rawLines.length + craftLines.length;
  const done = rawDone + craftDone;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  if (total === 0) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card/50 px-4 py-3 print:break-inside-avoid",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">
          Progress{" "}
          <span className="font-mono tabular-nums text-muted-foreground">
            {done} / {total}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          Raws {rawDone}/{rawLines.length} · Crafts {craftDone}/{craftLines.length} · {pct}%
        </p>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Checklist progress"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
