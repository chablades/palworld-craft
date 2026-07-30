"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Link2, Star } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FavoritesBar } from "@/components/FavoritesBar";
import { ItemTypeahead, type ItemTypeaheadHandle } from "@/components/ItemTypeahead";
import { MaterialInfoTip } from "@/components/MaterialInfoTip";
import { MaterialTreeCard } from "@/components/MaterialTreeCard";
import { PrintButton } from "@/components/PrintButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  applyCraftOffsets,
  applyInventoryOffsets,
  buildCraftingTree,
  calculateRecipe,
  getCraftableNames,
} from "@/lib/recipes";
import {
  buildShareSearchParams,
  copyText,
  formatResultsJson,
  formatResultsMarkdown,
  formatResultsPlain,
} from "@/lib/share";
import {
  loadFavorites,
  loadInventory,
  loadRecent,
  pushRecent,
  toggleFavorite,
} from "@/lib/storage";
import type { InventoryMap, TreeNode } from "@/lib/types";
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
  const [inventory, setInventory] = useState<InventoryMap>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "plain" | "md" | "json" | "link">("idle");
  const itemTypeaheadRef = useRef<ItemTypeaheadHandle>(null);

  const qty = Math.max(1, Number.isFinite(amount) ? Math.floor(amount) : 1);
  const isFavorite = favorites.includes(item);

  const refreshStorage = useCallback(() => {
    setInventory(loadInventory());
  }, []);

  useEffect(() => {
    setFavorites(loadFavorites());
    setRecent(loadRecent());
    refreshStorage();
    setHydrated(true);
  }, [refreshStorage]);

  useEffect(() => {
    if (!hydrated) return;
    const onFocus = () => refreshStorage();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "palcraft:inventory" || event.key === null) refreshStorage();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [hydrated, refreshStorage]);

  // Keep the share URL in sync without a Calculate button.
  useEffect(() => {
    if (!hydrated || !item || !craftables.includes(item)) return;
    const params = buildShareSearchParams({ item, qty });
    const next = `${pathname}?${params.toString()}`;
    const current = `${pathname}${window.location.search}`;
    if (next !== current) {
      router.replace(next, { scroll: false });
    }
  }, [hydrated, item, qty, craftables, pathname, router]);

  const tree = useMemo((): TreeNode | null => {
    if (!item || !craftables.includes(item)) return null;
    try {
      return buildCraftingTree(item, qty);
    } catch {
      return null;
    }
  }, [item, qty, craftables]);

  const materials = tree?.children ?? [];

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

  function selectItem(nextItem: string) {
    setItem(nextItem);
    setRecent(pushRecent(nextItem));
    refreshStorage();
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
            Search an item and quantity — materials update live. Click{" "}
            <span className="font-medium text-foreground">Show recipe</span> to expand crafts under
            a material. Use (?) for station, unlock, and source details.{" "}
            <span className="font-medium text-foreground">need / have</span> comes from{" "}
            <Link href="/storage" className="underline-offset-2 hover:underline">
              Storage
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FavoritesBar
            favorites={favorites.filter((name) => craftables.includes(name))}
            recent={recent.filter((name) => craftables.includes(name))}
            selected={item}
            onSelect={selectItem}
            onToggleFavorite={(name) => setFavorites(toggleFavorite(name))}
          />

          <div className="grid gap-4 sm:grid-cols-[1fr_120px_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="item" className="inline-flex items-center gap-1.5">
                Search item
                {item && <MaterialInfoTip name={item} isRaw={false} />}
              </Label>
              <ItemTypeahead
                ref={itemTypeaheadRef}
                id="item"
                value={item}
                options={craftables}
                onValueChange={(name) => {
                  setItem(name);
                  refreshStorage();
                }}
                onEnterCommit={(name) => selectItem(name)}
                placeholder="Search for an item…"
              />
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
          </div>
        </CardContent>
      </Card>

      {tree && (
        <Card className="print:break-inside-avoid">
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-center gap-2">
              Materials for {qty}× {item}
              <Badge variant="crafted">{materials.length}</Badge>
            </CardTitle>
            <CardDescription>
              Direct ingredients in each square. Expand a craftable material to reveal its recipe
              underneath.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button type="button" variant="outline" size="sm" onClick={() => handleCopy("plain")}>
                {copyStatus === "plain" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Copy text
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleCopy("md")}>
                {copyStatus === "md" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy Markdown
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleCopy("json")}>
                {copyStatus === "json" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Copy JSON
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleCopyLink}>
                {copyStatus === "link" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Copy share link
              </Button>
              <PrintButton />
              <Button type="button" variant="secondary" size="sm" asChild>
                <Link href={`/tree?item=${encodeURIComponent(item)}&qty=${qty}`}>
                  Open crafting tree
                </Link>
              </Button>
              <Button type="button" variant="ghost" size="sm" asChild>
                <Link href="/storage">Edit storage</Link>
              </Button>
            </div>

            {materials.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {materials.map((node) => (
                  <MaterialTreeCard key={node.id} node={node} inventory={inventory} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No materials required.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
