"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ItemIcon } from "@/components/ItemIcon";
import { ItemTypeahead } from "@/components/ItemTypeahead";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { compareItems } from "@/lib/compare";
import { itemToSlug } from "@/lib/meta";
import { getCraftableNames } from "@/lib/recipes";
import { cn } from "@/lib/utils";

export function ItemCompare() {
  const searchParams = useSearchParams();
  const craftables = useMemo(() => getCraftableNames(), []);

  const urlLeft = searchParams.get("left") ?? "";
  const urlRight = searchParams.get("right") ?? "";

  const [left, setLeft] = useState(
    craftables.includes(urlLeft)
      ? urlLeft
      : craftables.includes("Mega Sphere")
        ? "Mega Sphere"
        : craftables[0] ?? "",
  );
  const [right, setRight] = useState(
    craftables.includes(urlRight)
      ? urlRight
      : craftables.includes("Giga Sphere")
        ? "Giga Sphere"
        : craftables[1] ?? craftables[0] ?? "",
  );
  const [leftQty, setLeftQty] = useState(10);
  const [rightQty, setRightQty] = useState(10);

  const result = useMemo(() => {
    if (!left || !right) return null;
    try {
      return compareItems(left, leftQty, right, rightQty);
    } catch {
      return null;
    }
  }, [left, right, leftQty, rightQty]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compare Items</CardTitle>
          <CardDescription>
            Side-by-side raw costs for two craftables — useful for sphere tiers, weapons, or armor.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <ComparePicker
            label="Left"
            item={left}
            qty={leftQty}
            craftables={craftables}
            onItem={setLeft}
            onQty={setLeftQty}
          />
          <ComparePicker
            label="Right"
            item={right}
            qty={rightQty}
            craftables={craftables}
            onItem={setRight}
            onQty={setRightQty}
          />
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <SideCard side={result.left} />
            <SideCard side={result.right} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Raw material delta</CardTitle>
              <CardDescription>
                Positive delta means the right item needs more of that material.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.rawDiff.both.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Shared raws
                  </p>
                  <ul className="space-y-2">
                    {result.rawDiff.both.map((row) => (
                      <li
                        key={row.name}
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                      >
                        <Link
                          href={`/item/${itemToSlug(row.name)}`}
                          className="inline-flex items-center gap-2 hover:underline"
                        >
                          <ItemIcon name={row.name} />
                          {row.name}
                        </Link>
                        <span className="font-mono tabular-nums text-muted-foreground">
                          {row.left} vs {row.right}{" "}
                          <span
                            className={cn(
                              "font-semibold",
                              row.delta > 0 && "text-amber-700 dark:text-amber-300",
                              row.delta < 0 && "text-emerald-700 dark:text-emerald-300",
                              row.delta === 0 && "text-muted-foreground",
                            )}
                          >
                            ({row.delta > 0 ? "+" : ""}
                            {row.delta})
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <DiffList title="Only left" rows={result.rawDiff.onlyLeft} />
                <DiffList title="Only right" rows={result.rawDiff.onlyRight} />
              </div>

              {result.sharedCrafts.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Shared intermediates:{" "}
                  {result.sharedCrafts.map((name, i) => (
                    <span key={name}>
                      {i > 0 ? ", " : ""}
                      <Link
                        href={`/item/${itemToSlug(name)}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {name}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ComparePicker({
  label,
  item,
  qty,
  craftables,
  onItem,
  onQty,
}: {
  label: string;
  item: string;
  qty: number;
  craftables: string[];
  onItem: (v: string) => void;
  onQty: (v: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="space-y-2">
        <Label>Item</Label>
        <ItemTypeahead
          value={item}
          options={craftables}
          onValueChange={onItem}
          placeholder="Type a craftable item…"
        />
      </div>
      <div className="space-y-2">
        <Label>Quantity</Label>
        <Input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => onQty(Number(e.target.value) || 1)}
        />
      </div>
    </div>
  );
}

function SideCard({
  side,
}: {
  side: ReturnType<typeof compareItems>["left"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ItemIcon name={side.name} size="md" />
          <Link href={`/item/${itemToSlug(side.name)}`} className="hover:underline">
            {side.amount}× {side.name}
          </Link>
        </CardTitle>
        <CardDescription className="space-y-1">
          {side.station && <span className="block">Station: {side.station}</span>}
          {side.techLevel !== undefined && (
            <span className="block">
              Unlock: {side.techType === "ancient" ? "Ancient Tech" : "Tech"} Lv {side.techLevel}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="text-sm font-medium">Raws</p>
            <Badge variant="raw">{side.raws.length}</Badge>
          </div>
          <ul className="space-y-1">
            {side.raws.map(([name, qty]) => (
              <li key={name} className="flex justify-between text-sm">
                <span>{name}</span>
                <span className="font-mono tabular-nums">{qty}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="text-sm font-medium">Crafts</p>
            <Badge variant="crafted">{side.crafts.length}</Badge>
          </div>
          <ul className="space-y-1">
            {side.crafts.map(([name, qty]) => (
              <li key={name} className="flex justify-between text-sm">
                <span>{name}</span>
                <span className="font-mono tabular-nums">{qty}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function DiffList({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">None</p>
      ) : (
        <ul className="space-y-1">
          {rows.map(([name, qty]) => (
            <li key={name} className="flex justify-between text-sm">
              <Link href={`/item/${itemToSlug(name)}`} className="hover:underline">
                {name}
              </Link>
              <span className="font-mono tabular-nums">{qty}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
