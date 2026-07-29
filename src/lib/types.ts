export type RawMarker = "RAW";

export interface RecipeDefinition {
  ingredients: Record<string, number>;
}

export type RecipeEntry = RecipeDefinition | RawMarker;

export interface RecipeBookData {
  recipes: Record<string, RecipeEntry>;
}

export interface CalculationResult {
  raws: Record<string, number>;
  crafts: Record<string, number>;
}

export interface ShoppingListItem {
  name: string;
  amount: number;
}

export interface TreeNode {
  id: string;
  name: string;
  quantity: number;
  isRaw: boolean;
  children: TreeNode[];
}

export function isRaw(entry: RecipeEntry | undefined): entry is RawMarker {
  return entry === "RAW";
}

export function isRecipe(entry: RecipeEntry | undefined): entry is RecipeDefinition {
  return typeof entry === "object" && entry !== null && "ingredients" in entry;
}

export function validateRecipeBook(data: unknown): data is RecipeBookData {
  if (typeof data !== "object" || data === null || !("recipes" in data)) {
    return false;
  }

  const recipes = (data as RecipeBookData).recipes;
  if (typeof recipes !== "object" || recipes === null) return false;

  for (const [name, entry] of Object.entries(recipes)) {
    if (typeof name !== "string") return false;
    if (entry === "RAW") continue;
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof entry.ingredients !== "object" ||
      entry.ingredients === null
    ) {
      return false;
    }
    for (const [ing, qty] of Object.entries(entry.ingredients)) {
      if (typeof ing !== "string" || typeof qty !== "number" || qty <= 0) {
        return false;
      }
    }
  }

  return true;
}
