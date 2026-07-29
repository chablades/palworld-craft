import {
  calculateRecipe,
  getCraftableNames,
  getRecipeEntry,
  getStation,
  getTechInfo,
  sortedCraftEntries,
  sortedEntries,
} from "@/lib/recipes";
import { isRaw, isRecipe } from "@/lib/types";

export interface CompareSide {
  name: string;
  amount: number;
  raws: [string, number][];
  crafts: [string, number][];
  station?: string;
  techLevel?: number;
  techType?: "standard" | "ancient";
}

export interface CompareResult {
  left: CompareSide;
  right: CompareSide;
  /** Raw materials present on both sides (union of names that appear in both). */
  sharedRaws: string[];
  /** Craft intermediates present on both sides. */
  sharedCrafts: string[];
  rawDiff: {
    onlyLeft: [string, number][];
    onlyRight: [string, number][];
    both: { name: string; left: number; right: number; delta: number }[];
  };
}

function buildSide(name: string, amount: number): CompareSide {
  const result = calculateRecipe(name, amount);
  const tech = getTechInfo(name);
  return {
    name,
    amount,
    raws: sortedEntries(result.raws),
    crafts: sortedCraftEntries(result.crafts),
    station: getStation(name),
    techLevel: tech?.techLevel,
    techType: tech?.techType,
  };
}

export function compareItems(
  leftName: string,
  leftAmount: number,
  rightName: string,
  rightAmount: number,
): CompareResult {
  const left = buildSide(leftName, Math.max(1, leftAmount));
  const right = buildSide(rightName, Math.max(1, rightAmount));

  const leftRawMap = Object.fromEntries(left.raws);
  const rightRawMap = Object.fromEntries(right.raws);
  const allRawNames = [...new Set([...Object.keys(leftRawMap), ...Object.keys(rightRawMap)])].sort(
    (a, b) => a.localeCompare(b),
  );

  const onlyLeft: [string, number][] = [];
  const onlyRight: [string, number][] = [];
  const both: { name: string; left: number; right: number; delta: number }[] = [];
  const sharedRaws: string[] = [];

  for (const name of allRawNames) {
    const l = leftRawMap[name] ?? 0;
    const r = rightRawMap[name] ?? 0;
    if (l > 0 && r > 0) {
      sharedRaws.push(name);
      both.push({ name, left: l, right: r, delta: r - l });
    } else if (l > 0) {
      onlyLeft.push([name, l]);
    } else {
      onlyRight.push([name, r]);
    }
  }

  const leftCraftNames = new Set(left.crafts.map(([n]) => n));
  const sharedCrafts = right.crafts
    .map(([n]) => n)
    .filter((n) => leftCraftNames.has(n))
    .sort((a, b) => a.localeCompare(b));

  return {
    left,
    right,
    sharedRaws,
    sharedCrafts,
    rawDiff: { onlyLeft, onlyRight, both },
  };
}

/** Intermediates crafted more than once across a batch (good bulk-craft targets). */
export function findSharedIntermediates(
  craftCounts: Record<string, number>,
  minQuantity = 2,
): { name: string; quantity: number; usedBy: string[] }[] {
  const tips: { name: string; quantity: number; usedBy: string[] }[] = [];

  for (const [name, quantity] of Object.entries(craftCounts)) {
    if (quantity < minQuantity) continue;
    if (isRaw(getRecipeEntry(name))) continue;

    const usedBy: string[] = [];
    for (const parent of getCraftableNames()) {
      const entry = getRecipeEntry(parent);
      if (!isRecipe(entry)) continue;
      if (name in entry.ingredients && name !== parent) {
        usedBy.push(parent);
      }
    }

    tips.push({
      name,
      quantity,
      usedBy: usedBy.sort((a, b) => a.localeCompare(b)),
    });
  }

  return tips.sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));
}
