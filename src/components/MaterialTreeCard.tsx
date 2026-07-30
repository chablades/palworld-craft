"use client";

import Link from "next/link";
import { ItemIcon } from "@/components/ItemIcon";
import { MaterialMeta } from "@/components/MaterialMeta";
import { getStation, getTechInfo } from "@/lib/recipes";
import { itemToSlug } from "@/lib/meta";
import type { InventoryMap, TreeNode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MaterialTreeCardProps {
  node: TreeNode;
  inventory: InventoryMap;
  depth?: number;
}

export function MaterialTreeCard({ node, inventory, depth = 0 }: MaterialTreeCardProps) {
  const need = node.quantity;
  const have = Math.max(0, inventory[node.name] ?? 0);
  const enough = have >= need && need > 0;
  const short = have < need;
  const station = !node.isRaw ? getStation(node.name) : undefined;
  const tech = !node.isRaw ? getTechInfo(node.name) : null;
  const isRootLevel = depth === 0;

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        isRootLevel ? "border-border/70 bg-card/70 p-3 shadow-sm" : "border-border/50 bg-muted/20 p-2.5",
        enough && "border-emerald-500/40",
        short && isRootLevel && "border-red-500/30",
      )}
    >
      <div className="flex items-start gap-3">
        <ItemIcon name={node.name} size={isRootLevel ? "md" : "sm"} />
        <div className="min-w-0 flex-1">
          <p className={cn("leading-snug", isRootLevel ? "font-semibold" : "text-sm font-medium")}>
            <Link
              href={`/item/${itemToSlug(node.name)}`}
              className="underline-offset-2 hover:underline"
            >
              {node.name}
            </Link>
          </p>
          <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <span>{node.isRaw ? "Raw" : "Crafted"}</span>
            {station && <span>Station: {station}</span>}
            {tech?.techLevel !== undefined && (
              <span>
                {tech.techType === "ancient" ? "Ancient Tech" : "Tech"} Lv {tech.techLevel}
              </span>
            )}
          </div>
          {node.isRaw && isRootLevel && (
            <div className="mt-1">
              <MaterialMeta name={node.name} />
            </div>
          )}
        </div>
        <div className="shrink-0 text-right font-mono text-sm tabular-nums">
          <p
            className={cn(
              "font-semibold",
              enough ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
            )}
            aria-label={`Need ${need}, have ${have}`}
          >
            <span>{need}</span>
            <span className="mx-0.5 text-muted-foreground">/</span>
            <span>{have}</span>
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">need / have</p>
          {short && (
            <p className="text-xs text-red-600 dark:text-red-400">short {need - have}</p>
          )}
        </div>
      </div>

      {node.children.length > 0 && (
        <div
          className={cn(
            "mt-3 space-y-2 border-l-2 pl-3",
            enough ? "border-emerald-500/30" : "border-border/60",
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Materials to make {node.name}
          </p>
          {node.children.map((child) => (
            <MaterialTreeCard
              key={child.id}
              node={child}
              inventory={inventory}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
