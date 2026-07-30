"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRawNames, groupItemsByCategory } from "@/lib/recipes";
import { loadInventory, saveInventory } from "@/lib/storage";
import type { InventoryMap } from "@/lib/types";

export function StorageTracker() {
  const rawNames = useMemo(() => getRawNames(), []);
  const [inventory, setInventory] = useState<InventoryMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setInventory(loadInventory());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveInventory(inventory);
  }, [inventory, hydrated]);

  const groups = useMemo(() => groupItemsByCategory(filter, rawNames), [filter, rawNames]);
  const storedCount = Object.values(inventory).filter((n) => n > 0).length;

  function setOwned(name: string, owned: number) {
    setInventory((prev) => {
      const next = { ...prev };
      if (owned <= 0) delete next[name];
      else next[name] = owned;
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Storage</CardTitle>
          <CardDescription>
            Track how many Pal materials and other raws you already have. This stays separate from
            the calculator so craft plans always show full ingredient needs.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter materials…"
            className="max-w-sm"
            aria-label="Filter storage materials"
          />
          <p className="text-sm text-muted-foreground">
            {storedCount} material{storedCount === 1 ? "" : "s"} with stock
          </p>
          {storedCount > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setInventory({})}>
              Clear all
            </Button>
          )}
        </CardContent>
      </Card>

      {groups.map((group) => (
        <Card key={group.category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{group.category}</CardTitle>
            <CardDescription>
              {group.items.length} item{group.items.length === 1 ? "" : "s"}
              {group.category === "Pal Materials"
                ? " — organs, glands, oils, and ranch drops"
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {group.items.map((name) => (
                <li key={name} className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm">{name}</span>
                  <Input
                    className="w-24"
                    type="number"
                    min={0}
                    value={inventory[name] ?? 0}
                    onChange={(e) =>
                      setOwned(name, Math.max(0, Number(e.target.value) || 0))
                    }
                    aria-label={`Owned ${name}`}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      {groups.length === 0 && (
        <p className="text-sm text-muted-foreground">No materials match your filter.</p>
      )}
    </div>
  );
}
