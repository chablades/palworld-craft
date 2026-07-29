"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InventoryPanel } from "@/components/InventoryPanel";
import { ResultLine } from "@/components/ResultLine";
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
import {
  applyCraftOffsets,
  applyInventoryOffsets,
  calculateRecipe,
  getCraftableNames,
} from "@/lib/recipes";
import {
  buildShareSearchParams,
  copyText,
  formatResultsMarkdown,
  formatResultsPlain,
  parseInventoryParam,
} from "@/lib/share";
import { loadInventory, saveInventory } from "@/lib/storage";
import type { InventoryMap } from "@/lib/types";

export function RecipeCalculator() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const craftables = useMemo(() => getCraftableNames(), []);

  const initialItem = searchParams.get("item") ?? craftables[0] ?? "Thermal Core";
  const initialQty = Number(searchParams.get("qty") ?? "20");
  const urlInventory = parseInventoryParam(searchParams.get("inv"));

  const [item, setItem] = useState(
    craftables.includes(initialItem) ? initialItem : craftables[0] ?? "",
  );
  const [amount, setAmount] = useState(
    Number.isFinite(initialQty) && initialQty > 0 ? Math.floor(initialQty) : 20,
  );
  const [submitted, setSubmitted] = useState({ item, amount });
  const [inventory, setInventory] = useState<InventoryMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "plain" | "md" | "link">("idle");

  useEffect(() => {
    const stored = loadInventory();
    setInventory({ ...stored, ...urlInventory });
    setHydrated(true);
    // URL inventory is only applied on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveInventory(inventory);
  }, [inventory, hydrated]);

  const result = useMemo(() => {
    try {
      return calculateRecipe(submitted.item, submitted.amount);
    } catch {
      return null;
    }
  }, [submitted]);

  const rawLines = useMemo(
    () => (result ? applyInventoryOffsets(result.raws, inventory) : []),
    [result, inventory],
  );
  const craftLines = useMemo(
    () => (result ? applyCraftOffsets(result.crafts, inventory) : []),
    [result, inventory],
  );

  const inventoryNames = useMemo(() => {
    const names = new Set<string>();
    for (const line of rawLines) names.add(line.name);
    for (const line of craftLines) names.add(line.name);
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [rawLines, craftLines]);

  function setOwned(name: string, owned: number) {
    setInventory((prev) => {
      const next = { ...prev };
      if (owned <= 0) delete next[name];
      else next[name] = owned;
      return next;
    });
  }

  function syncUrl(nextItem: string, nextQty: number, nextInventory: InventoryMap) {
    const params = buildShareSearchParams({
      item: nextItem,
      qty: nextQty,
      inventory: nextInventory,
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function handleCopy(format: "plain" | "md") {
    if (!result) return;
    const payload =
      format === "plain"
        ? formatResultsPlain({
            title: `${submitted.amount}× ${submitted.item}`,
            raws: rawLines,
            crafts: craftLines,
          })
        : formatResultsMarkdown({
            title: `${submitted.amount}× ${submitted.item}`,
            raws: rawLines,
            crafts: craftLines,
          });
    const ok = await copyText(payload);
    if (ok) {
      setCopyStatus(format);
      window.setTimeout(() => setCopyStatus("idle"), 1500);
    }
  }

  async function handleCopyLink() {
    syncUrl(submitted.item, submitted.amount, inventory);
    const params = buildShareSearchParams({
      item: submitted.item,
      qty: submitted.amount,
      inventory,
    });
    const url = `${window.location.origin}${pathname}?${params.toString()}`;
    const ok = await copyText(url);
    if (ok) {
      setCopyStatus("link");
      window.setTimeout(() => setCopyStatus("idle"), 1500);
    }
  }

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
        <CardContent className="space-y-4">
          <form
            className="grid gap-4 sm:grid-cols-[1fr_120px_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const next = { item, amount: Math.max(1, amount) };
              setSubmitted(next);
              syncUrl(next.item, next.amount, inventory);
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

          {result && (
            <InventoryPanel
              itemNames={inventoryNames}
              inventory={inventory}
              onChange={setOwned}
            />
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => handleCopy("plain")}>
              {copyStatus === "plain" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy text
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleCopy("md")}>
              {copyStatus === "md" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy Markdown
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleCopyLink}>
              {copyStatus === "link" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              Copy share link
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Raw Materials
                  <Badge variant="raw">{rawLines.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Gather remaining materials after inventory offsets.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {rawLines.map((line) => (
                    <ResultLine key={line.name} line={line} showMeta />
                  ))}
                  {rawLines.length === 0 && (
                    <li className="text-sm text-muted-foreground">No raw materials.</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Crafting Order
                  <Badge variant="crafted">{craftLines.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Bottom-up craft order — make intermediates before dependents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {craftLines.map((line, index) => (
                    <ResultLine
                      key={line.name}
                      line={line}
                      showStation
                      step={index + 1}
                    />
                  ))}
                  {craftLines.length === 0 && (
                    <li className="text-sm text-muted-foreground">No crafts required.</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
