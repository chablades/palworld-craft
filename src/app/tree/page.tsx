import { Suspense } from "react";
import { CraftingTree } from "@/components/CraftingTree";

export default function TreePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Crafting Tree</h1>
        <p className="text-muted-foreground">
          Inspect the full ingredient dependency graph for any craftable item.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading tree…</p>}>
        <CraftingTree />
      </Suspense>
    </div>
  );
}
