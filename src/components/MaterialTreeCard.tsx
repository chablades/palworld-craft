"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ItemIcon } from "@/components/ItemIcon";
import { MaterialInfoTip } from "@/components/MaterialInfoTip";
import { itemToSlug } from "@/lib/meta";
import type { InventoryMap, TreeNode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MaterialTreeCardProps {
  node: TreeNode;
  inventory: InventoryMap;
}

function MaterialRow({
  node,
  inventory,
  depth,
}: {
  node: TreeNode;
  inventory: InventoryMap;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const need = node.quantity;
  const have = Math.max(0, inventory[node.name] ?? 0);
  const enough = have >= need && need > 0;
  const short = have < need;
  const hasRecipe = node.children.length > 0;

  return (
    <div className={cn(depth > 0 && "ml-3 border-l border-border/50 pl-2")}>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors",
          depth === 0 && "bg-muted/30",
          short && depth === 0 && "bg-red-500/5",
          enough && "bg-emerald-500/5",
        )}
      >
        <ItemIcon name={node.name} size="sm" />
        <Link
          href={`/item/${itemToSlug(node.name)}`}
          className={cn(
            "min-w-0 truncate underline-offset-2 hover:underline",
            depth === 0 ? "font-semibold" : "text-sm font-medium",
          )}
        >
          {node.name}
        </Link>
        <MaterialInfoTip name={node.name} isRaw={node.isRaw} />
        <div
          className={cn(
            "ml-1 shrink-0 font-mono text-sm tabular-nums font-semibold",
            enough ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
          )}
          aria-label={`Need ${need}, have ${have}`}
        >
          {need}
          <span className="mx-0.5 font-normal text-muted-foreground">/</span>
          {have}
        </div>
      </div>

      {hasRecipe && (
        <button
          type="button"
          className={cn(
            "mt-1 flex w-full items-center justify-between gap-2 rounded-md border border-dashed px-2.5 py-1.5 text-left text-xs transition-colors",
            expanded
              ? "border-primary/40 bg-primary/5 text-foreground"
              : "border-border/70 text-muted-foreground hover:border-primary/35 hover:bg-accent/40 hover:text-foreground",
          )}
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
        >
          <span>
            {expanded ? "Hide recipe" : "Show recipe"} · {node.children.length} material
            {node.children.length === 1 ? "" : "s"}
          </span>
          <ChevronDown
            className={cn("h-3.5 w-3.5 shrink-0 transition-transform", expanded && "rotate-180")}
          />
        </button>
      )}

      {hasRecipe && expanded && (
        <div className="mt-1.5 space-y-1">
          {node.children.map((child) => (
            <MaterialRow key={child.id} node={child} inventory={inventory} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/** One top-level material square; craft recipes expand below on click. */
export function MaterialTreeCard({ node, inventory }: MaterialTreeCardProps) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/70 p-2 shadow-sm print:break-inside-avoid">
      <MaterialRow node={node} inventory={inventory} depth={0} />
    </div>
  );
}
