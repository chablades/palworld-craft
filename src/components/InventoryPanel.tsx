"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InventoryMap } from "@/lib/types";

interface InventoryPanelProps {
  itemNames: string[];
  inventory: InventoryMap;
  onChange: (name: string, amount: number) => void;
  description?: string;
}

export function InventoryPanel({
  itemNames,
  inventory,
  onChange,
  description = "Amounts in storage are subtracted from remaining needs.",
}: InventoryPanelProps) {
  if (itemNames.length === 0) return null;

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4 print:hidden">
      <div>
        <Label className="text-sm font-semibold">Storage</Label>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {itemNames.map((name) => (
          <li key={name} className="flex items-center justify-between gap-3">
            <span className="truncate text-sm">{name}</span>
            <Input
              className="w-24"
              type="number"
              min={0}
              value={inventory[name] ?? 0}
              onChange={(e) => onChange(name, Math.max(0, Number(e.target.value) || 0))}
              aria-label={`Storage ${name}`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
