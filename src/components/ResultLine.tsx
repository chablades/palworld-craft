"use client";

import { MaterialMeta } from "@/components/MaterialMeta";
import { getStation } from "@/lib/recipes";
import type { OffsetLine } from "@/lib/types";

interface ResultLineProps {
  line: OffsetLine;
  showMeta?: boolean;
  showStation?: boolean;
  step?: number;
}

export function ResultLine({
  line,
  showMeta = false,
  showStation = false,
  step,
}: ResultLineProps) {
  const station = showStation ? getStation(line.name) : undefined;
  const covered = line.remaining === 0 && line.required > 0;

  return (
    <li className="rounded-md border border-border/50 px-3 py-2 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={covered ? "text-muted-foreground line-through" : undefined}>
            {step !== undefined ? `${step}. ` : ""}
            {line.name}
          </p>
          {station && (
            <p className="text-xs text-muted-foreground">Station: {station}</p>
          )}
          {showMeta && <MaterialMeta name={line.name} />}
        </div>
        <div className="shrink-0 text-right font-mono text-sm tabular-nums">
          <p className="font-semibold">{line.remaining}</p>
          {(line.owned > 0 || line.remaining !== line.required) && (
            <p className="text-xs text-muted-foreground">
              of {line.required}
              {line.owned > 0 ? ` (−${line.owned})` : ""}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
