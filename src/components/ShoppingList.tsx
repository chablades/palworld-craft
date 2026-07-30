"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Link2, Plus, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EfficiencyTips } from "@/components/EfficiencyTips";
import { InventoryPanel } from "@/components/InventoryPanel";
import { ItemIcon } from "@/components/ItemIcon";
import { ItemTypeahead, type ItemTypeaheadHandle } from "@/components/ItemTypeahead";
import { PrintButton } from "@/components/PrintButton";
import { ProgressSummary } from "@/components/ProgressSummary";
import { ResultLine } from "@/components/ResultLine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  applyCraftOffsets,
  applyInventoryOffsets,
  calculateBatch,
  getCraftableNames,
} from "@/lib/recipes";
import {
  buildShareSearchParams,
  copyText,
  formatResultsJson,
  formatResultsMarkdown,
  formatResultsPlain,
  parseInventoryParam,
  parseListParam,
} from "@/lib/share";
import {
  loadChecklist,
  loadInventory,
  loadShoppingList,
  saveChecklist,
  saveInventory,
  saveShoppingList,
  type ChecklistMap,
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
  const [checklist, setChecklist] = useState<ChecklistMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "plain" | "md" | "json" | "link">("idle");
  const draftTypeaheadRef = useRef<ItemTypeaheadHandle>(null);

  const planKey = useMemo(
    () =>
      `list:${items
        .map((i) => `${i.name}x${i.amount}`)
        .sort()
        .join("|")}`,
    [items],
  );

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

  useEffect(() => {
    if (!hydrated) return;
    setChecklist(loadChecklist(planKey));
  }, [planKey, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveChecklist(planKey, checklist);
  }, [checklist, planKey, hydrated]);

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

  function addItem(name = draftName, amount = draftAmount) {
    const resolved = name || draftTypeaheadRef.current?.resolve() || draftName;
    if (!resolved || amount <= 0) return;
    setDraftName(resolved);
    setItems((prev) => {
      const existing = prev.find((p) => p.name === resolved);
      if (existing) {
        return prev.map((p) =>
          p.name === resolved ? { ...p, amount: p.amount + amount } : p,
        );
      }
      return [...prev, { name: resolved, amount }];
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

  async function handleCopy(format: "plain" | "md" | "json") {
    const title =
      items.length === 0
        ? "Shopping list"
        : `Shopping list (${items.map((i) => `${i.amount}× ${i.name}`).join(", ")})`;
    const sections = { title, raws: rawLines, crafts: craftLines };
    const payload =
      format === "plain"
        ? formatResultsPlain(sections)
        : format === "md"
          ? formatResultsMarkdown(sections)
          : formatResultsJson(sections);
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
            steps. List and storage persist in this browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="shop-item">Add item</Label>
              <ItemTypeahead
                ref={draftTypeaheadRef}
                id="shop-item"
                value={draftName}
                options={craftables}
                onValueChange={setDraftName}
                onEnterCommit={(name) => addItem(name, draftAmount)}
                placeholder="Type a craftable item…"
              />
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
            <Button
              type="button"
              onClick={() => {
                const resolved = draftTypeaheadRef.current?.resolve() ?? draftName;
                addItem(resolved, draftAmount);
              }}
            >
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
                <span className="inline-flex items-center gap-2 font-medium">
                  <ItemIcon name={item.name} />
                  {item.name}
                </span>
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

          <div className="flex flex-wrap gap-2 print:hidden">
            <Button type="button" variant="outline" size="sm" onClick={() => handleCopy("plain")}>
              {copyStatus === "plain" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy text
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleCopy("md")}>
              {copyStatus === "md" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy Markdown
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleCopy("json")}>
              {copyStatus === "json" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy JSON
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
            <PrintButton />
          </div>
        </CardContent>
      </Card>

      <ProgressSummary rawLines={rawLines} craftLines={craftLines} checklist={checklist} />

      <EfficiencyTips crafts={result.crafts} />

      <div className="grid gap-4 md:grid-cols-2 print:grid-cols-1">
        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Combined Raw Materials
              <Badge variant="raw">{rawLines.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {rawLines.map((line) => (
                <ResultLine
                  key={line.name}
                  line={line}
                  showMeta
                  showUsedBy
                  checked={Boolean(checklist[`raw:${line.name}`])}
                  onCheckedChange={(checked) =>
                    setChecklist((prev) => ({
                      ...prev,
                      [`raw:${line.name}`]: checked,
                    }))
                  }
                />
              ))}
              {rawLines.length === 0 && (
                <li className="text-sm text-muted-foreground">No raw materials yet.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="print:break-inside-avoid">
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
                  showTech
                  step={index + 1}
                  checked={Boolean(checklist[`craft:${line.name}`])}
                  onCheckedChange={(checked) =>
                    setChecklist((prev) => ({
                      ...prev,
                      [`craft:${line.name}`]: checked,
                    }))
                  }
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
