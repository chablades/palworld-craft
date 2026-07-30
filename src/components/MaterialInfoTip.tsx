"use client";

import { useEffect, useId, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";
import { getRawMeta, getRecipeEntry, getStation, getTechInfo } from "@/lib/recipes";
import { cn } from "@/lib/utils";

interface MaterialInfoTipProps {
  name: string;
  isRaw: boolean;
  className?: string;
}

export function MaterialInfoTip({ name, isRaw, className }: MaterialInfoTipProps) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const station = !isRaw ? getStation(name) : undefined;
  const tech = !isRaw ? getTechInfo(name) : null;
  const meta = isRaw ? getRawMeta(getRecipeEntry(name)) : null;
  const sources = meta?.sources ?? [];
  const drops = meta?.drops ?? [];

  const hasInfo =
    Boolean(station) ||
    tech?.techLevel !== undefined ||
    sources.length > 0 ||
    drops.length > 0 ||
    true; // always show at least raw/crafted type

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!hasInfo) return null;

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={`Details for ${name}`}
        aria-expanded={open}
        aria-controls={tipId}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          id={tipId}
          role="dialog"
          className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-popover p-3 text-xs text-popover-foreground shadow-md"
        >
          <p className="font-semibold text-foreground">{name}</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>{isRaw ? "Raw material" : "Crafted item"}</li>
            {station && <li>Station: {station}</li>}
            {tech?.techLevel !== undefined && (
              <li>
                Unlock: {tech.techType === "ancient" ? "Ancient Tech" : "Tech"} Lv {tech.techLevel}
              </li>
            )}
            {sources.length > 0 && <li>Sources: {sources.join(" · ")}</li>}
            {drops.length > 0 && <li>Pal drops: {drops.join(", ")}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
