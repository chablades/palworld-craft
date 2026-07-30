"use client";

import Link from "next/link";
import { ItemIcon } from "@/components/ItemIcon";
import { MaterialMeta } from "@/components/MaterialMeta";
import { getStation, getTechInfo, getUsedBy } from "@/lib/recipes";
import { itemToSlug } from "@/lib/meta";
import type { OffsetLine } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ResultLineProps {
  line: OffsetLine;
  showMeta?: boolean;
  showStation?: boolean;
  showTech?: boolean;
  showUsedBy?: boolean;
  step?: number;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function ResultLine({
  line,
  showMeta = false,
  showStation = false,
  showTech = false,
  showUsedBy = false,
  step,
  checked,
  onCheckedChange,
}: ResultLineProps) {
  const station = showStation ? getStation(line.name) : undefined;
  const tech = showTech ? getTechInfo(line.name) : null;
  const usedBy = showUsedBy ? getUsedBy(line.name) : [];
  const covered = line.remaining === 0 && line.required > 0;
  const done = checked || covered;

  return (
    <li
      className={cn(
        "rounded-md border border-border/50 px-3 py-2 text-sm transition-colors",
        done && "bg-primary/5",
      )}
    >
      <div className="flex items-start gap-3">
        {onCheckedChange !== undefined && (
          <input
            type="checkbox"
            className="mt-1.5 h-4 w-4 accent-primary"
            checked={Boolean(checked)}
            onChange={(e) => onCheckedChange(e.target.checked)}
            aria-label={`Mark ${line.name} done`}
          />
        )}
        <ItemIcon name={line.name} />
        <div className="min-w-0 flex-1">
          <p className={cn(done && "text-muted-foreground line-through")}>
            {step !== undefined ? `${step}. ` : ""}
            <Link
              href={`/item/${itemToSlug(line.name)}`}
              className="underline-offset-2 hover:underline"
            >
              {line.name}
            </Link>
          </p>
          {station && (
            <p className="text-xs text-muted-foreground">Station: {station}</p>
          )}
          {tech?.techLevel !== undefined && (
            <p className="text-xs text-muted-foreground">
              Unlock: {tech.techType === "ancient" ? "Ancient Tech" : "Tech"} Lv{" "}
              {tech.techLevel}
            </p>
          )}
          {showMeta && <MaterialMeta name={line.name} />}
          {usedBy.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Used by:{" "}
              {usedBy.slice(0, 6).map((name, i) => (
                <span key={name}>
                  {i > 0 ? ", " : ""}
                  <Link
                    href={`/item/${itemToSlug(name)}`}
                    className="underline-offset-2 hover:text-foreground hover:underline"
                  >
                    {name}
                  </Link>
                </span>
              ))}
              {usedBy.length > 6 ? ` +${usedBy.length - 6}` : ""}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right font-mono text-sm tabular-nums">
          <p className="font-semibold" aria-label={`Need ${line.required}`}>
            {line.required}
          </p>
          {line.owned > 0 && (
            <p className="text-xs text-muted-foreground">
              {line.remaining} left (−{line.owned} owned)
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
