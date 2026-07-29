import { Suspense } from "react";
import { RecipeCalculator } from "@/components/RecipeCalculator";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Calculator</h1>
        <p className="text-muted-foreground">
          Expand a single recipe into sorted raw materials and crafting steps.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading calculator…</p>}>
        <RecipeCalculator />
      </Suspense>
    </div>
  );
}
