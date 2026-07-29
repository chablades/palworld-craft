"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateBatch, getCraftableNames, sortedEntries } from "@/lib/recipes";
import type { ShoppingListItem } from "@/lib/types";

export function ShoppingList() {
  const craftables = useMemo(() => getCraftableNames(), []);
  const [items, setItems] = useState<ShoppingListItem[]>([
    { name: "Thermal Core", amount: 20 },
    { name: "Computer", amount: 2 },
  ]);
  const [draftName, setDraftName] = useState(craftables[0] ?? "");
  const [draftAmount, setDraftAmount] = useState(1);

  const result = useMemo(() => calculateBatch(items), [items]);
  const raws = sortedEntries(result.raws);
  const crafts = sortedEntries(result.crafts);

  function addItem() {
    if (!draftName || draftAmount <= 0) return;
    setItems((prev) => {
      const existing = prev.find((p) => p.name === draftName);
      if (existing) {
        return prev.map((p) =>
          p.name === draftName ? { ...p, amount: p.amount + draftAmount } : p,
        );
      }
      return [...prev, { name: draftName, amount: draftAmount }];
    });
  }

  function removeItem(name: string) {
    setItems((prev) => prev.filter((p) => p.name !== name));
  }

  function updateAmount(name: string, amount: number) {
    setItems((prev) =>
      prev.map((p) => (p.name === name ? { ...p, amount: Math.max(1, amount) } : p)),
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch Shopping List</CardTitle>
          <CardDescription>
            Queue multiple craft targets and get a combined raw materials list plus crafting
            steps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto] sm:items-end">
            <div className="space-y-2">
              <Label>Add item</Label>
              <Select value={draftName} onValueChange={setDraftName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {craftables.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-amount">Qty</Label>
              <Input
                id="shop-amount"
                type="number"
                min={1}
                value={draftAmount}
                onChange={(e) => setDraftAmount(Number(e.target.value) || 1)}
              />
            </div>
            <Button type="button" onClick={addItem}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.name}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <span className="font-medium">{item.name}</span>
                <div className="flex items-center gap-2">
                  <Input
                    className="w-24"
                    type="number"
                    min={1}
                    value={item.amount}
                    onChange={(e) => updateAmount(item.name, Number(e.target.value) || 1)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => removeItem(item.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
            {items.length === 0 && (
              <li className="text-sm text-muted-foreground">Add craftable items to begin.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Combined Raw Materials
              <Badge variant="raw">{raws.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {raws.map(([name, qty]) => (
                <li
                  key={name}
                  className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 text-sm"
                >
                  <span>{name}</span>
                  <span className="font-mono font-semibold tabular-nums">{qty}</span>
                </li>
              ))}
              {raws.length === 0 && (
                <li className="text-sm text-muted-foreground">No raw materials yet.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Combined Crafting List
              <Badge variant="crafted">{crafts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {crafts.map(([name, qty]) => (
                <li
                  key={name}
                  className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 text-sm"
                >
                  <span>{name}</span>
                  <span className="font-mono font-semibold tabular-nums">{qty}</span>
                </li>
              ))}
              {crafts.length === 0 && (
                <li className="text-sm text-muted-foreground">No crafts yet.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
