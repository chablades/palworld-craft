"use client";

import { useEffect, useId, useState } from "react";
import { ItemIcon } from "@/components/ItemIcon";
import { Input } from "@/components/ui/input";
import { findClosestItem } from "@/lib/recipes";
import { cn } from "@/lib/utils";

interface ItemTypeaheadProps {
  id?: string;
  value: string;
  options: string[];
  onValueChange: (name: string) => void;
  placeholder?: string;
  className?: string;
}

export function ItemTypeahead({
  id,
  value,
  options,
  onValueChange,
  placeholder = "Type an item name…",
  className,
}: ItemTypeaheadProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [query, setQuery] = useState(value);
  const match = findClosestItem(query, options) ?? (query.trim() === "" ? value : null);
  const showMatch = Boolean(match && match.toLowerCase() !== query.trim().toLowerCase());

  useEffect(() => {
    setQuery(value);
  }, [value]);

  function commitClosest() {
    const next = findClosestItem(query, options) ?? value;
    if (options.includes(next)) {
      setQuery(next);
      onValueChange(next);
    } else if (options.includes(value)) {
      setQuery(value);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Input
        id={inputId}
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        aria-autocomplete="list"
        aria-controls={`${inputId}-match`}
        onChange={(e) => {
          const nextQuery = e.target.value;
          setQuery(nextQuery);
          const closest = findClosestItem(nextQuery, options);
          if (closest) onValueChange(closest);
        }}
        onBlur={commitClosest}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitClosest();
          } else if (e.key === "Escape") {
            setQuery(value);
          }
        }}
      />
      {match ? (
        <div
          id={`${inputId}-match`}
          className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-sm"
          aria-live="polite"
        >
          <ItemIcon name={match} />
          <span className="min-w-0 truncate font-medium">{match}</span>
          {showMatch && (
            <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">closest match</span>
          )}
        </div>
      ) : (
        query.trim() !== "" && (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            No matching item.
          </p>
        )
      )}
    </div>
  );
}
