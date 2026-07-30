"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Link2, Star } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FavoritesBar } from "@/components/FavoritesBar";
import { EfficiencyTips } from "@/components/EfficiencyTips";
import { InventoryPanel } from "@/components/InventoryPanel";
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
  calculateRecipe,
  getCraftableNames,
  getTechInfo,
} from "@/lib/recipes";
import {
  buildShareSearchParams,
  copyText,
  formatResultsJson,
  formatResultsMarkdown,
  formatResultsPlain,
  parseInventoryParam,
} from "@/lib/share";
import {
  loadChecklist,
  loadFavorites,
  loadInventory,
  loadRecent,
  pushRecent,
  saveChecklist,
  saveInventory,
  toggleFavorite,
  type ChecklistMap,
} from "@/lib/storage";
import type { InventoryMap } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RecipeCalculator() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const craftables = useMemo(() => getCraftableNames(), []);

  const initialItem = searchParams.get("item") ?? "AI Core";
  const initialQty = Number(searchParams.get("qty") ?? "1");
  const urlInventory = parseInventoryParam(searchParams.get("inv"));

  const [item, setItem] = useState(
    craftables.includes(initialItem) ? initialItem : craftables[0] ?? "",
  );
  const [amount, setAmount] = useState(
    Number.isFinite(initialQty) && initialQty > 0 ? Math.floor(initialQty) : 1,
  );
  const [inventory, setInventory] = useState<InventoryMap>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<ChecklistMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "plain" | "md" | "json" | "link">("idle");
  const itemTypeaheadRef = useRef<ItemTypeaheadHandle>(null);

  const qty = Math.max(1, Number.isFinite(amount) ? Math.floor(amount) : 1);
  const planKey = `${item}:${qty}`;
  const tech = getTechInfo(item);
  const isFavorite = favorites.includes(item);

  useEffect(() => {
    const stored = loadInventory();
    setInventory({ ...stored, ...urlInventory });
    setFavorites(loadFavorites());
    setRecent(loadRecent());
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Live expansion: changing item or quantity immediately updates totals.
  const result = useMemo(() => {
    if (!item || !craftables.includes(item)) return null;
    try {
      return calculateRecipe(item, qty);
    } catch {
      return null;
    }
  }, [item, qty, craftables]);

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

  function submitPlan(nextItem: string, nextQty: number) {
    const nextAmount = Math.max(1, nextQty);
    setItem(nextItem);
    setAmount(nextAmount);
    setRecent(pushRecent(nextItem));
    syncUrl(nextItem, nextAmount, inventory);
  }

  async function handleCopy(format: "plain" | "md" | "json") {
    if (!result) return;
    const sections = {
      title: `${qty}× ${item}`,
      raws: rawLines,
      crafts: craftLines,
    };
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
    syncUrl(item, qty, inventory);
    const params = buildShareSearchParams({
      item,
      qty,
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
            Pick a craftable item and quantity. Totals update live with the full dependency tree —
            raw materials and intermediate crafts needed for that amount.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FavoritesBar
            favorites={favorites.filter((name) => craftables.includes(name))}
            recent={recent.filter((name) => craftables.includes(name))}
            selected={item}
            onSelect={(name) => submitPlan(name, amount)}
            onToggleFavorite={(name) => setFavorites(toggleFavorite(name))}
          />

          <form
            className="grid gap-4 sm:grid-cols-[1fr_120px_auto_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const resolved = itemTypeaheadRef.current?.resolve() ?? item;
              if (!resolved) return;
              submitPlan(resolved, amount);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="item">Item</Label>
              <ItemTypeahead
                ref={itemTypeaheadRef}
                id="item"
                value={item}
                options={craftables}
                onValueChange={setItem}
                onEnterCommit={(name) => submitPlan(name, amount)}
                placeholder="Type a craftable item…"
              />
              {tech?.techLevel !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Unlock: {tech.techType === "ancient" ? "Ancient Tech" : "Tech"} Lv{" "}
                  {tech.techLevel}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Quantity</Label>
              <Input
                id="amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setAmount(Number.isFinite(next) && next > 0 ? Math.floor(next) : 1);
                }}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
              onClick={() => setFavorites(toggleFavorite(item))}
            >
              <Star className={cn("h-4 w-4", isFavorite && "fill-current text-amber-500")} />
            </Button>
            <Button type="submit">Update link</Button>
          </form>

          {result && (
            <>
              <p className="text-sm text-muted-foreground">
                Showing materials for{" "}
                <span className="font-medium text-foreground">
                  {qty}× {item}
                </span>
                .
              </p>
              <InventoryPanel
                itemNames={inventoryNames}
                inventory={inventory}
                onChange={setOwned}
                description="Optional: amounts in storage are subtracted from what you still need. Required totals above stay visible."
              />
              {Object.keys(inventory).length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="print:hidden"
                  onClick={() => setInventory({})}
                >
                  Clear storage offsets
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
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
            <PrintButton />
          </div>

          <ProgressSummary rawLines={rawLines} craftLines={craftLines} checklist={checklist} />

          <EfficiencyTips crafts={result.crafts} />

          <div className="grid gap-4 md:grid-cols-2 print:grid-cols-1">
            <Card className="print:break-inside-avoid">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Raw Materials
                  <Badge variant="raw">{rawLines.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Amounts needed for {qty}× {item}. Check off materials as you gather them.
                </CardDescription>
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
                    <li className="text-sm text-muted-foreground">No raw materials.</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card className="print:break-inside-avoid">
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
