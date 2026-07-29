"use client";

import { getRawMeta, getRecipeEntry } from "@/lib/recipes";

interface MaterialMetaProps {
  name: string;
}

export function MaterialMeta({ name }: MaterialMetaProps) {
  const meta = getRawMeta(getRecipeEntry(name));
  if (!meta) return null;

  const sources = meta.sources ?? [];
  const drops = meta.drops ?? [];
  if (sources.length === 0 && drops.length === 0) return null;

  return (
    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
      {sources.length > 0 && (
        <p>
          <span className="font-medium text-foreground/70">Sources:</span>{" "}
          {sources.join(" · ")}
        </p>
      )}
      {drops.length > 0 && (
        <p>
          <span className="font-medium text-foreground/70">Pal drops:</span>{" "}
          {drops.join(", ")}
        </p>
      )}
    </div>
  );
}
