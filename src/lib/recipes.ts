import recipeData from "@/data/recipes.json";
import type {
  CalculationResult,
  InventoryMap,
  OffsetLine,
  RecipeBookData,
  RecipeEntry,
  ShoppingListItem,
  TreeNode,
} from "@/lib/types";
import { getRawMeta, isRaw, isRecipe, validateRecipeBook } from "@/lib/types";

export { getRawMeta, validateRecipeBook };

const book = recipeData as RecipeBookData;

export function getRecipeBook(): RecipeBookData {
  return book;
}

export function getAllItemNames(): string[] {
  return Object.keys(book.recipes).sort((a, b) => a.localeCompare(b));
}

export function getCraftableNames(): string[] {
  return getAllItemNames().filter((name) => isRecipe(book.recipes[name]));
}

export function getRawNames(): string[] {
  return getAllItemNames().filter((name) => isRaw(book.recipes[name]));
}

export function getRecipeEntry(name: string): RecipeEntry | undefined {
  return book.recipes[name];
}

export function getStation(name: string): string | undefined {
  const entry = book.recipes[name];
  return isRecipe(entry) ? entry.station : undefined;
}

export function searchRecipes(
  query: string,
  filter: "all" | "crafted" | "raw" = "all",
): string[] {
  const q = query.trim().toLowerCase();
  let names = getAllItemNames();

  if (filter === "crafted") names = getCraftableNames();
  if (filter === "raw") names = getRawNames();

  if (!q) return names;

  return names.filter((name) => name.toLowerCase().includes(q));
}

function addCounts(target: Record<string, number>, key: string, amount: number) {
  target[key] = (target[key] ?? 0) + amount;
}

/**
 * Port of the Python Recipe._calculate logic.
 * Recursively expands crafted ingredients into raw materials and intermediate crafts.
 */
function calculateInternal(
  itemName: string,
  amount: number,
  recipes: Record<string, RecipeEntry>,
): CalculationResult {
  const raws: Record<string, number> = {};
  const crafts: Record<string, number> = {};

  const entry = recipes[itemName];
  if (entry === undefined) {
    throw new Error(`Missing recipe for ${itemName}`);
  }

  if (isRaw(entry)) {
    addCounts(raws, itemName, amount);
    return { raws, crafts };
  }

  addCounts(crafts, itemName, amount);

  for (const [ingredient, quantity] of Object.entries(entry.ingredients)) {
    const needed = amount * quantity;
    const subEntry = recipes[ingredient];

    if (subEntry === undefined) {
      throw new Error(`Missing recipe for ${ingredient}`);
    }

    if (isRaw(subEntry)) {
      addCounts(raws, ingredient, needed);
    } else {
      const sub = calculateInternal(ingredient, needed, recipes);
      for (const [raw, qty] of Object.entries(sub.raws)) {
        addCounts(raws, raw, qty);
      }
      for (const [craft, qty] of Object.entries(sub.crafts)) {
        addCounts(crafts, craft, qty);
      }
    }
  }

  return { raws, crafts };
}

export function calculateRecipe(
  itemName: string,
  amount: number,
): CalculationResult {
  if (amount <= 0) {
    return { raws: {}, crafts: {} };
  }

  const entry = book.recipes[itemName];
  if (entry === undefined) {
    throw new Error(`Missing recipe for ${itemName}`);
  }

  if (isRaw(entry)) {
    return { raws: { [itemName]: amount }, crafts: {} };
  }

  return calculateInternal(itemName, amount, book.recipes);
}

export function calculateBatch(items: ShoppingListItem[]): CalculationResult {
  const raws: Record<string, number> = {};
  const crafts: Record<string, number> = {};

  for (const item of items) {
    if (!item.name || item.amount <= 0) continue;
    const result = calculateRecipe(item.name, item.amount);
    for (const [raw, qty] of Object.entries(result.raws)) {
      addCounts(raws, raw, qty);
    }
    for (const [craft, qty] of Object.entries(result.crafts)) {
      addCounts(crafts, craft, qty);
    }
  }

  return { raws, crafts };
}

export function sortedEntries(counts: Record<string, number>): [string, number][] {
  return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
}

function toOffsetLine(
  name: string,
  required: number,
  inventory: InventoryMap,
): OffsetLine {
  const owned = Math.max(0, inventory[name] ?? 0);
  return {
    name,
    required,
    owned,
    remaining: Math.max(0, required - owned),
  };
}

/**
 * Subtract owned inventory from required counts (alphabetical).
 * Remaining is never negative.
 */
export function applyInventoryOffsets(
  counts: Record<string, number>,
  inventory: InventoryMap,
): OffsetLine[] {
  return sortedEntries(counts).map(([name, required]) =>
    toOffsetLine(name, required, inventory),
  );
}

/**
 * Inventory-aware craft lines in bottom-up dependency order.
 */
export function applyCraftOffsets(
  crafts: Record<string, number>,
  inventory: InventoryMap,
): OffsetLine[] {
  return sortedCraftEntries(crafts).map(([name, required]) =>
    toOffsetLine(name, required, inventory),
  );
}

/**
 * Bottom-up craft order: ingredients (leaves) before dependents.
 * Falls back to alphabetical when there is no dependency edge.
 */
export function sortedCraftEntries(
  crafts: Record<string, number>,
  recipes: Record<string, RecipeEntry> = book.recipes,
): [string, number][] {
  const names = Object.keys(crafts);
  if (names.length <= 1) {
    return names.map((name) => [name, crafts[name]] as [string, number]);
  }

  const nameSet = new Set(names);
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const name of names) {
    indegree.set(name, 0);
    dependents.set(name, []);
  }

  for (const name of names) {
    const entry = recipes[name];
    if (!isRecipe(entry)) continue;
    for (const ingredient of Object.keys(entry.ingredients)) {
      if (!nameSet.has(ingredient)) continue;
      dependents.get(ingredient)!.push(name);
      indegree.set(name, (indegree.get(name) ?? 0) + 1);
    }
  }

  const queue = names
    .filter((name) => (indegree.get(name) ?? 0) === 0)
    .sort((a, b) => a.localeCompare(b));
  const ordered: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    ordered.push(current);
    const next = (dependents.get(current) ?? []).slice().sort((a, b) => a.localeCompare(b));
    for (const dep of next) {
      const remaining = (indegree.get(dep) ?? 0) - 1;
      indegree.set(dep, remaining);
      if (remaining === 0) queue.push(dep);
    }
    queue.sort((a, b) => a.localeCompare(b));
  }

  // Cycle fallback: append any leftover alphabetically.
  if (ordered.length < names.length) {
    const leftover = names
      .filter((name) => !ordered.includes(name))
      .sort((a, b) => a.localeCompare(b));
    ordered.push(...leftover);
  }

  return ordered.map((name) => [name, crafts[name]]);
}

/**
 * Build a tree suitable for visual crafting graph display.
 */
export function buildCraftingTree(
  itemName: string,
  quantity: number,
  path: string[] = [],
): TreeNode {
  const id = [...path, itemName].join(">");
  const entry = book.recipes[itemName];

  if (entry === undefined) {
    throw new Error(`Missing recipe for ${itemName}`);
  }

  if (isRaw(entry)) {
    return {
      id,
      name: itemName,
      quantity,
      isRaw: true,
      children: [],
    };
  }

  return {
    id,
    name: itemName,
    quantity,
    isRaw: false,
    children: Object.entries(entry.ingredients).map(([ingredient, qty]) =>
      buildCraftingTree(ingredient, quantity * qty, [...path, itemName]),
    ),
  };
}
