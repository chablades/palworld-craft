"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Link2, Star } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FavoritesBar } from "@/components/FavoritesBar";
import { EfficiencyTips } from "@/components/EfficiencyTips";
import { ItemTypeahead, type ItemTypeaheadHandle } from "@/components/ItemTypeahead";
import { PrintButton } from "@/components/PrintButton";
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
} from "@/lib/share";
import {
  loadChecklist,
  loadFavorites,
  loadRecent,
  pushRecent,
  saveChecklist,
  toggleFavorite,
  type ChecklistMap,
} from "@/lib/storage";
import { cn } from "@/lib/utils";

export function RecipeCalculator() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const craftables = useMemo(() => getCraftableNames(), []);

  const initialItem = searchParams.get("item") ?? "AI Core";
  const initialQty = Number(searchParams.get("qty") ?? "1");

  const [item, setItem] = useState(
    craftables.includes(initialItem) ? initialItem : craftables[0] ?? "",
  );
  const [amount, setAmount] = useState(
    Number.isFinite(initialQty) && initialQty > 0 ? Math.floor(initialQty) : 1,
  );
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
    setFavorites(loadFavorites());
    setRecent(loadRecent());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setChecklist(loadChecklist(planKey));
  }, [planKey, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveChecklist(planKey, checklist);
  }, [checklist, planKey, hydrated]);

  const result = useMemo(() => {
    if (!item || !craftables.includes(item)) return null;
    try {
      return calculateRecipe(item, qty);
    } catch {
      return null;
    }
  }, [item, qty, craftables]);

  // No storage offsets on the calculator — show full required amounts only.
  const rawLines = useMemo(
    () => (result ? applyInventoryOffsets(result.raws, {}) : []),
    [result],
  );
  const craftLines = useMemo(
    () => (result ? applyCraftOffsets(result.crafts, {}) : []),
    [result],
  );

  function syncUrl(nextItem: string, nextQty: number) {
    const params = buildShareSearchParams({
      item: nextItem,
      qty: nextQty,
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function submitPlan(nextItem: string, nextQty: number) {
    const nextAmount = Math.max(1, nextQty);
    setItem(nextItem);
    setAmount(nextAmount);
    setRecent(pushRecent(nextItem));
    syncUrl(nextItem, nextAmount);
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
    syncUrl(item, qty);
    const params = buildShareSearchParams({ item, qty });
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
            Choose an item and quantity to see every ingredient you need — raw materials and
            intermediate crafts. Totals update live.
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
            <p className="text-sm text-muted-foreground">
              Ingredients needed for{" "}
              <span className="font-medium text-foreground">
                {qty}× {item}
              </span>
              . Track owned materials on the{" "}
              <Link href="/storage" className="underline-offset-2 hover:underline">
                Storage
              </Link>{" "}
              tab.
            </p>
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
            <Button type="button" variant="secondary" size="sm" asChild>
              <Link href={`/tree?item=${encodeURIComponent(item)}&qty=${qty}`}>
                Open crafting tree
              </Link>
            </Button>
          </div>

          <EfficiencyTips crafts={result.crafts} />

          <div className="grid gap-4 md:grid-cols-2 print:grid-cols-1">
            <Card className="print:break-inside-avoid">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Raw Materials
                  <Badge variant="raw">{rawLines.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Gather these for {qty}× {item}.
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
                  Bottom-up order — craft intermediates before dependents.
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
