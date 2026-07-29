"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2, Plus, Trash2 } from "lucide-react";
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
  calculateBatch,
  getCraftableNames,
} from "@/lib/recipes";
import {
  buildShareSearchParams,
  copyText,
  formatResultsMarkdown,
  formatResultsPlain,
  parseInventoryParam,
  parseListParam,
} from "@/lib/share";
import {
  loadInventory,
  loadShoppingList,
  saveInventory,
  saveShoppingList,
} from "@/lib/storage";
import type { InventoryMap, ShoppingListItem } from "@/lib/types";

const DEFAULT_ITEMS: ShoppingListItem[] = [
  { name: "Thermal Core", amount: 20 },
  { name: "Computer", amount: 2 },
];

export function ShoppingList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const craftables = useMemo(() => getCraftableNames(), []);

  const urlList = parseListParam(searchParams.get("list"));
  const urlInventory = parseInventoryParam(searchParams.get("inv"));

  const [items, setItems] = useState<ShoppingListItem[]>(DEFAULT_ITEMS);
  const [draftName, setDraftName] = useState(craftables[0] ?? "");
  const [draftAmount, setDraftAmount] = useState(1);
  const [inventory, setInventory] = useState<InventoryMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "plain" | "md" | "link">("idle");

  useEffect(() => {
    const storedItems = loadShoppingList(DEFAULT_ITEMS);
    const storedInventory = loadInventory();
    const nextItems =
      urlList.length > 0
        ? urlList.filter((item) => craftables.includes(item.name))
        : storedItems.filter((item) => craftables.includes(item.name));
    setItems(nextItems.length > 0 ? nextItems : DEFAULT_ITEMS.filter((i) => craftables.includes(i.name)));
    setInventory({ ...storedInventory, ...urlInventory });
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveShoppingList(items);
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveInventory(inventory);
  }, [inventory, hydrated]);

  const result = useMemo(() => calculateBatch(items), [items]);
  const rawLines = useMemo(
    () => applyInventoryOffsets(result.raws, inventory),
    [result, inventory],
  );
  const craftLines = useMemo(
    () => applyCraftOffsets(result.crafts, inventory),
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

  function syncUrl(nextItems: ShoppingListItem[], nextInventory: InventoryMap) {
    const params = buildShareSearchParams({
      list: nextItems,
      inventory: nextInventory,
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function handleCopy(format: "plain" | "md") {
    const title =
      items.length === 0
        ? "Shopping list"
        : `Shopping list (${items.map((i) => `${i.amount}× ${i.name}`).join(", ")})`;
    const payload =
      format === "plain"
        ? formatResultsPlain({ title, raws: rawLines, crafts: craftLines })
        : formatResultsMarkdown({ title, raws: rawLines, crafts: craftLines });
    const ok = await copyText(payload);
    if (ok) {
      setCopyStatus(format);
      window.setTimeout(() => setCopyStatus("idle"), 1500);
    }
  }

  async function handleCopyLink() {
    syncUrl(items, inventory);
    const params = buildShareSearchParams({ list: items, inventory });
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
          <CardTitle>Batch Shopping List</CardTitle>
          <CardDescription>
            Queue multiple craft targets and get a combined raw materials list plus crafting
            steps. List and inventory persist in this browser.
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

          <InventoryPanel
            itemNames={inventoryNames}
            inventory={inventory}
            onChange={setOwned}
          />

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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => syncUrl(items, inventory)}
            >
              Update URL
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Combined Raw Materials
              <Badge variant="raw">{rawLines.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {rawLines.map((line) => (
                <ResultLine key={line.name} line={line} showMeta />
              ))}
              {rawLines.length === 0 && (
                <li className="text-sm text-muted-foreground">No raw materials yet.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Combined Crafting Order
              <Badge variant="crafted">{craftLines.length}</Badge>
            </CardTitle>
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
                <li className="text-sm text-muted-foreground">No crafts yet.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
