"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ItemIcon } from "@/components/ItemIcon";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRecipeEntry, getUsedBy, searchRecipes } from "@/lib/recipes";
import { isRaw } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "crafted" | "raw";

interface RecipeSearchProps {
  onSelect?: (name: string) => void;
  linkToCalculator?: boolean;
}

export function RecipeSearch({ onSelect, linkToCalculator = true }: RecipeSearchProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const results = useMemo(() => searchRecipes(query, filter), [query, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes…"
          className="sm:max-w-md"
        />
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="crafted">Crafted</TabsTrigger>
            <TabsTrigger value="raw">Raw</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((name) => {
          const entry = getRecipeEntry(name);
          const raw = isRaw(entry);
          const usedByCount = raw ? getUsedBy(name).length : 0;
          const rowClass =
            "flex w-full items-center justify-between gap-3 rounded-lg border border-border/70 bg-card/60 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40";

          const inner = (
            <>
              <span className="flex min-w-0 items-center gap-2">
                <ItemIcon name={name} />
                <span className="truncate font-medium">{name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {raw && usedByCount > 0 && (
                  <span className="text-[11px] text-muted-foreground">{usedByCount} uses</span>
                )}
                <Badge variant={raw ? "raw" : "crafted"}>{raw ? "RAW" : "Crafted"}</Badge>
              </span>
            </>
          );

          if (onSelect) {
            return (
              <li key={name}>
                <button type="button" className={rowClass} onClick={() => onSelect(name)}>
                  {inner}
                </button>
              </li>
            );
          }

          if (linkToCalculator && !raw) {
            return (
              <li key={name}>
                <Link href={`/?item=${encodeURIComponent(name)}`} className={rowClass}>
                  {inner}
                </Link>
              </li>
            );
          }

          return (
            <li key={name} className={cn(rowClass, "cursor-default")}>
              {inner}
            </li>
          );
        })}
      </ul>

      {results.length === 0 && (
        <p className="text-sm text-muted-foreground">No recipes match your search.</p>
      )}
    </div>
  );
}
