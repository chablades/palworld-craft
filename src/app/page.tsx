import { Suspense } from "react";
import { RecipeCalculator } from "@/components/RecipeCalculator";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Calculator</h1>
        <p className="text-muted-foreground">
          Search an item to see the materials you need — nested under each material when it requires
          more crafts.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading calculator…</p>}>
        <RecipeCalculator />
      </Suspense>
    </div>
  );
}
