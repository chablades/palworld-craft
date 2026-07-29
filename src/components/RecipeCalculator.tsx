"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { calculateRecipe, getCraftableNames, sortedEntries } from "@/lib/recipes";

export function RecipeCalculator() {
  const searchParams = useSearchParams();
  const craftables = useMemo(() => getCraftableNames(), []);
  const initialItem = searchParams.get("item") ?? craftables[0] ?? "Thermal Core";

  const [item, setItem] = useState(
    craftables.includes(initialItem) ? initialItem : craftables[0] ?? "",
  );
  const [amount, setAmount] = useState(20);
  const [submitted, setSubmitted] = useState({ item, amount });

  const result = useMemo(() => {
    try {
      return calculateRecipe(submitted.item, submitted.amount);
    } catch {
      return null;
    }
  }, [submitted]);

  const raws = result ? sortedEntries(result.raws) : [];
  const crafts = result ? sortedEntries(result.crafts) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recipe Calculator</CardTitle>
          <CardDescription>
            Pick a craftable item and quantity. We expand the full dependency tree into raw
            materials and intermediate crafts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-[1fr_120px_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted({ item, amount: Math.max(1, amount) });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="item">Item</Label>
              <Select value={item} onValueChange={setItem}>
                <SelectTrigger id="item">
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
              <Label htmlFor="amount">Quantity</Label>
              <Input
                id="amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 1)}
              />
            </div>
            <Button type="submit">Calculate</Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Raw Materials
                <Badge variant="raw">{raws.length}</Badge>
              </CardTitle>
              <CardDescription>Gather these base materials first.</CardDescription>
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
                  <li className="text-sm text-muted-foreground">No raw materials.</li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Crafting List
                <Badge variant="crafted">{crafts.length}</Badge>
              </CardTitle>
              <CardDescription>Craft intermediates bottom-up, then the target.</CardDescription>
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
                  <li className="text-sm text-muted-foreground">No crafts required.</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
