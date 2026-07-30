import type { Metadata } from "next";
import { Suspense } from "react";
import { RecipeSearch } from "@/components/RecipeSearch";

export const metadata: Metadata = {
  title: "Browse Recipes | Palcraft",
  description: "Search and filter Palworld craftables and raw materials in the Palcraft recipe book.",
};

export default function BrowsePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Browse</h1>
        <p className="text-muted-foreground">
          Search the recipe book. Craftables open in the calculator; every item also has a detail page.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading browse…</p>}>
        <RecipeSearch />
      </Suspense>
    </div>
  );
}
