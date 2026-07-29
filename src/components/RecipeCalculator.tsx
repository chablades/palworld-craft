"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2, Star } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FavoritesBar } from "@/components/FavoritesBar";
import { InventoryPanel } from "@/components/InventoryPanel";
import { ItemIcon } from "@/components/ItemIcon";
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
  getTechInfo,
} from "@/lib/recipes";
import {
  buildShareSearchParams,
  copyText,
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
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<ChecklistMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "plain" | "md" | "link">("idle");

  const planKey = `${submitted.item}:${submitted.amount}`;
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

  function submitPlan(nextItem: string, nextQty: number) {
    const next = { item: nextItem, amount: Math.max(1, nextQty) };
    setItem(next.item);
    setAmount(next.amount);
    setSubmitted(next);
    setRecent(pushRecent(next.item));
    syncUrl(next.item, next.amount, inventory);
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
              submitPlan(item, amount);
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
                      <span className="inline-flex items-center gap-2">
                        <ItemIcon name={name} />
                        {name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                onChange={(e) => setAmount(Number(e.target.value) || 1)}
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

          <div className="grid gap-4 md:grid-cols-2 print:grid-cols-1">
            <Card className="print:break-inside-avoid">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Raw Materials
                  <Badge variant="raw">{rawLines.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Check off materials as you gather them. Sources and drops listed below each item.
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
