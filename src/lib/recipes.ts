import recipeData from "@/data/recipes.json";
import type {
  CalculationResult,
  InventoryMap,
  OffsetLine,
  RecipeBookData,
  RecipeDefinition,
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

export function getItemCategory(name: string): string {
  const entry = book.recipes[name];
  if (entry && typeof entry === "object" && "category" in entry && entry.category?.trim()) {
    return entry.category.trim();
  }
  return "Other";
}

export function getTechInfo(
  name: string,
): { techLevel?: number; techType?: "standard" | "ancient" } | null {
  const entry = book.recipes[name];
  if (!isRecipe(entry)) return null;
  return { techLevel: entry.techLevel, techType: entry.techType };
}

/** Recipes that directly consume this item as an ingredient. */
export function getUsedBy(itemName: string): string[] {
  const users: string[] = [];
  for (const [name, entry] of Object.entries(book.recipes)) {
    if (!isRecipe(entry)) continue;
    if (itemName in entry.ingredients) users.push(name);
  }
  return users.sort((a, b) => a.localeCompare(b));
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

/** Higher is better. Returns -1 when there is no useful match. */
function scoreItemMatch(query: string, name: string): number {
  const q = query.trim().toLowerCase();
  const n = name.toLowerCase();
  if (!q) return 0;
  if (n === q) return 1000;
  if (n.startsWith(q)) return 800 - Math.min(n.length, 100);
  const words = n.split(/\s+/);
  if (words.some((word) => word.startsWith(q))) return 600 - Math.min(n.length, 100);
  const idx = n.indexOf(q);
  if (idx >= 0) return 400 - idx - Math.min(n.length, 100);
  return -1;
}

/** Closest item name for a typed query, or null when nothing matches. */
export function findClosestItem(query: string, names: string[]): string | null {
  const q = query.trim();
  if (!q || names.length === 0) return null;

  let best: string | null = null;
  let bestScore = -1;
  for (const name of names) {
    const score = scoreItemMatch(q, name);
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }
  return bestScore >= 0 ? best : null;
}

/** Filtered item names ranked by closeness to the query. Empty query returns all names. */
export function filterItems(query: string, names: string[]): string[] {
  const q = query.trim();
  if (!q) return [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  return names
    .map((name) => ({ name, score: scoreItemMatch(q, name) }))
    .filter((entry) => entry.score >= 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    )
    .map((entry) => entry.name);
}

export interface ItemCategoryGroup {
  category: string;
  items: string[];
}

/** Group filtered items by category. Categories and items are alphabetical. */
export function groupItemsByCategory(query: string, names: string[]): ItemCategoryGroup[] {
  const matched = new Set(filterItems(query, names));
  const byCategory = new Map<string, string[]>();

  for (const name of names) {
    if (!matched.has(name)) continue;
    const category = getItemCategory(name);
    const list = byCategory.get(category);
    if (list) list.push(name);
    else byCategory.set(category, [name]);
  }

  return [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    }));
}

function addCounts(target: Record<string, number>, key: string, amount: number) {
  target[key] = (target[key] ?? 0) + amount;
}

/** Units produced by one craft. Recipes without an explicit yield produce a single unit. */
export function getYield(entry: RecipeDefinition): number {
  const produced = entry.yield;
  return produced !== undefined && Number.isInteger(produced) && produced > 0 ? produced : 1;
}

/**
 * Reachable items ordered so every consumer comes before the ingredients it consumes.
 * Reverse depth-first post-order over the dependency DAG.
 */
function consumersFirstOrder(
  roots: string[],
  recipes: Record<string, RecipeEntry>,
): string[] {
  const visited = new Set<string>();
  const postOrder: string[] = [];

  function visit(name: string) {
    if (visited.has(name)) return;
    visited.add(name);

    const entry = recipes[name];
    if (entry === undefined) {
      throw new Error(`Missing recipe for ${name}`);
    }
    if (isRecipe(entry)) {
      for (const ingredient of Object.keys(entry.ingredients)) visit(ingredient);
    }
    postOrder.push(name);
  }

  for (const root of roots) visit(root);
  return postOrder.reverse();
}

/**
 * Expands seeded demand into raw materials and intermediate crafts.
 *
 * Demand is summed across every consumer of an item before it is divided into batches,
 * so a batch recipe shared by two consumers is rounded up once instead of once per consumer.
 */
function expandDemand(
  seed: Map<string, number>,
  recipes: Record<string, RecipeEntry>,
): CalculationResult {
  const raws: Record<string, number> = {};
  const crafts: Record<string, number> = {};
  const leftovers: Record<string, number> = {};
  const demand = new Map(seed);

  for (const name of consumersFirstOrder([...seed.keys()], recipes)) {
    const needed = demand.get(name) ?? 0;
    if (needed <= 0) continue;

    const entry = recipes[name];
    if (isRaw(entry)) {
      addCounts(raws, name, needed);
      continue;
    }

    const perCraft = getYield(entry);
    const batches = Math.ceil(needed / perCraft);
    const produced = batches * perCraft;
    addCounts(crafts, name, produced);
    if (produced > needed) {
      addCounts(leftovers, name, produced - needed);
    }

    for (const [ingredient, quantity] of Object.entries(entry.ingredients)) {
      demand.set(ingredient, (demand.get(ingredient) ?? 0) + batches * quantity);
    }
  }

  return { raws, crafts, leftovers };
}

export function calculateRecipe(
  itemName: string,
  amount: number,
  recipes: Record<string, RecipeEntry> = book.recipes,
): CalculationResult {
  if (amount <= 0) {
    return { raws: {}, crafts: {}, leftovers: {} };
  }

  if (recipes[itemName] === undefined) {
    throw new Error(`Missing recipe for ${itemName}`);
  }

  return expandDemand(new Map([[itemName, amount]]), recipes);
}

/** Demand across the whole list is pooled, so shared batch recipes round up once. */
export function calculateBatch(
  items: ShoppingListItem[],
  recipes: Record<string, RecipeEntry> = book.recipes,
): CalculationResult {
  const seed = new Map<string, number>();

  for (const item of items) {
    if (!item.name || item.amount <= 0) continue;
    if (recipes[item.name] === undefined) {
      throw new Error(`Missing recipe for ${item.name}`);
    }
    seed.set(item.name, (seed.get(item.name) ?? 0) + item.amount);
  }

  if (seed.size === 0) return { raws: {}, crafts: {}, leftovers: {} };
  return expandDemand(seed, recipes);
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
  recipes: Record<string, RecipeEntry> = book.recipes,
  path: string[] = [],
): TreeNode {
  const id = [...path, itemName].join(">");
  const entry = recipes[itemName];

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

  // Ingredient amounts follow whole crafts, so a batch recipe does not overstate its inputs.
  const batches = Math.ceil(quantity / getYield(entry));

  return {
    id,
    name: itemName,
    quantity,
    isRaw: false,
    children: Object.entries(entry.ingredients).map(([ingredient, qty]) =>
      buildCraftingTree(ingredient, batches * qty, recipes, [...path, itemName]),
    ),
  };
}
