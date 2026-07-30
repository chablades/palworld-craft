"use client";

import Link from "next/link";
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
  const need = node.quantity;
  const have = Math.max(0, inventory[node.name] ?? 0);
  const enough = have >= need && need > 0;
  const short = have < need;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors",
          depth === 0 && "bg-muted/30",
          short && depth === 0 && "bg-red-500/5",
          enough && "bg-emerald-500/5",
        )}
        style={{ paddingLeft: `${0.5 + depth * 1.15}rem` }}
      >
        <ItemIcon name={node.name} size="sm" />
        <Link
          href={`/item/${itemToSlug(node.name)}`}
          className={cn(
            "min-w-0 flex-1 truncate underline-offset-2 hover:underline",
            depth === 0 ? "font-semibold" : "text-sm font-medium",
          )}
        >
          {node.name}
        </Link>
        <MaterialInfoTip name={node.name} isRaw={node.isRaw} />
        <div
          className={cn(
            "shrink-0 text-right font-mono text-sm tabular-nums font-semibold",
            enough ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
          )}
          aria-label={`Need ${need}, have ${have}`}
        >
          {need}
          <span className="mx-0.5 font-normal text-muted-foreground">/</span>
          {have}
        </div>
      </div>

      {node.children.map((child) => (
        <MaterialRow key={child.id} node={child} inventory={inventory} depth={depth + 1} />
      ))}
    </div>
  );
}

/** One top-level material square with indented craft children. */
export function MaterialTreeCard({ node, inventory }: MaterialTreeCardProps) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/70 p-2 shadow-sm print:break-inside-avoid">
      <MaterialRow node={node} inventory={inventory} depth={0} />
    </div>
  );
}
