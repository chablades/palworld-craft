import { Suspense } from "react";
import { ShoppingList } from "@/components/ShoppingList";

export default function ShoppingListPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Shopping List</h1>
        <p className="text-muted-foreground">
          Batch multiple craft targets into one combined materials list.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading shopping list…</p>}>
        <ShoppingList />
      </Suspense>
    </div>
  );
}
