import recipeData from "@/data/recipes.json";
import type {
  CalculationResult,
  RecipeBookData,
  RecipeEntry,
  ShoppingListItem,
  TreeNode,
} from "@/lib/types";
import { isRaw, isRecipe, validateRecipeBook } from "@/lib/types";

export { validateRecipeBook };

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

