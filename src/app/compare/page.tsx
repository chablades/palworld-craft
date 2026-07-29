import { Suspense } from "react";
import { ItemCompare } from "@/components/ItemCompare";

export default function ComparePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Compare</h1>
        <p className="text-muted-foreground">
          Compare raw material costs between two craftable items.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading compare…</p>}>
        <ItemCompare />
      </Suspense>
    </div>
  );
}
