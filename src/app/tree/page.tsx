import { Suspense } from "react";
import { CraftingTree } from "@/components/CraftingTree";

export default function TreePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Crafting Tree</h1>
        <p className="text-muted-foreground">
          Look up an item to see it as the parent node, with required ingredients as children below.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading tree…</p>}>
        <CraftingTree />
      </Suspense>
    </div>
  );
}
