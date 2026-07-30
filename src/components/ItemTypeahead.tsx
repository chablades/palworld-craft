"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { ItemIcon } from "@/components/ItemIcon";
import { Input } from "@/components/ui/input";
import { findClosestItem, groupItemsByCategory } from "@/lib/recipes";
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
  placeholder = "Search items…",
  className,
}: ItemTypeaheadProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlight, setHighlight] = useState(0);

  const groups = useMemo(() => groupItemsByCategory(query, options), [query, options]);
  const results = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const indexByName = useMemo(() => {
    const map = new Map<string, number>();
    results.forEach((name, index) => map.set(name, index));
    return map;
  }, [results]);

  useEffect(() => {
    if (!open) setQuery(value);
  }, [value, open]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open, results]);

  function selectItem(name: string) {
    onValueChange(name);
    setQuery(name);
    setOpen(false);
  }

  function commitFromQuery() {
    const next =
      results[highlight] ?? findClosestItem(query, options) ?? (options.includes(value) ? value : null);
    if (next) selectItem(next);
    else {
      setQuery(value);
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results[highlight] ? `${listId}-option-${highlight}` : undefined}
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="pr-9"
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onBlur={(e) => {
            const next = e.relatedTarget as Node | null;
            if (rootRef.current?.contains(next)) return;
            commitFromQuery();
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              if (results.length > 0) {
                setHighlight((i) => (open ? (i + 1) % results.length : 0));
              }
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              if (results.length > 0) {
                setHighlight((i) => (open ? (i - 1 + results.length) % results.length : results.length - 1));
              }
            } else if (e.key === "Enter") {
              e.preventDefault();
              commitFromQuery();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setQuery(value);
              setOpen(false);
            }
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? "Close item list" : "Open item list"}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((prev) => !prev)}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {results.length === 0 ? (
            <li className="px-2 py-2 text-sm text-muted-foreground">No matching items</li>
          ) : (
            groups.map((group) => (
              <li key={group.category} role="presentation" className="mt-1 first:mt-0">
                <div className="sticky top-0 z-10 bg-popover px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {group.category}
                </div>
                <ul role="group" aria-label={group.category} className="space-y-0.5">
                  {group.items.map((name) => {
                    const index = indexByName.get(name) ?? 0;
                    const selected = name === value;
                    const active = index === highlight;
                    return (
                      <li key={name} role="presentation">
                        <button
                          type="button"
                          id={`${listId}-option-${index}`}
                          role="option"
                          aria-selected={selected}
                          data-active={active ? "true" : "false"}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none",
                            active && "bg-accent text-accent-foreground",
                            !active && "hover:bg-accent/60",
                          )}
                          onMouseDown={(e) => e.preventDefault()}
                          onMouseEnter={() => setHighlight(index)}
                          onClick={() => selectItem(name)}
                        >
                          <ItemIcon name={name} />
                          <span className="min-w-0 flex-1 truncate">{name}</span>
                          {selected && <Check className="h-3.5 w-3.5 shrink-0 opacity-70" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
