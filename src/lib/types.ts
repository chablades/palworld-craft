export type RawMarker = "RAW";

export interface RawMaterialDefinition {
  type: "RAW";
  /** Material / item class for grouped browsing (Ores, Pal Materials, Ingots, …). */
  category?: string;
  /** Where the material is commonly obtained (mining, chests, merchants, etc.). */
  sources?: string[];
  /** Pals known to drop this material. */
  drops?: string[];
}

export interface RecipeDefinition {
  ingredients: Record<string, number>;
  /** Units produced by one craft. Omitted means one. Batch recipes (arrows, ammo) produce several per craft. */
  yield?: number;
  /** Material / item class for grouped browsing (Ores, Pal Materials, Ingots, …). */
  category?: string;
  /** Crafting station where this recipe is made. */
  station?: string;
  /** Technology / Ancient Technology level required to unlock. */
  techLevel?: number;
  /** Optional note such as "Ancient Technology" vs standard tech tree. */
  techType?: "standard" | "ancient";
}

export type RecipeEntry = RecipeDefinition | RawMarker | RawMaterialDefinition;

export interface RecipeBookData {
  recipes: Record<string, RecipeEntry>;
}

export interface CalculationResult {
  raws: Record<string, number>;
  crafts: Record<string, number>;
  /** Units produced beyond what the plan needs, when a batch recipe overshoots. */
  leftovers: Record<string, number>;
}

export interface OffsetLine {
  name: string;
  required: number;
  owned: number;
  remaining: number;
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

export type InventoryMap = Record<string, number>;

export function isRaw(
  entry: RecipeEntry | undefined,
): entry is RawMarker | RawMaterialDefinition {
  if (entry === "RAW") return true;
  return (
    typeof entry === "object" &&
    entry !== null &&
    "type" in entry &&
    (entry as RawMaterialDefinition).type === "RAW"
  );
}

export function isRecipe(entry: RecipeEntry | undefined): entry is RecipeDefinition {
  return typeof entry === "object" && entry !== null && "ingredients" in entry;
}

export function getRawMeta(
  entry: RecipeEntry | undefined,
): Pick<RawMaterialDefinition, "sources" | "drops"> | null {
  if (!isRaw(entry)) return null;
  if (entry === "RAW") return { sources: undefined, drops: undefined };
  return { sources: entry.sources, drops: entry.drops };
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
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

    if (typeof entry !== "object" || entry === null) return false;

    if ("type" in entry && (entry as RawMaterialDefinition).type === "RAW") {
      const raw = entry as RawMaterialDefinition;
      if (raw.category !== undefined && (typeof raw.category !== "string" || !raw.category.trim())) {
        return false;
      }
      if (raw.sources !== undefined && !isNonEmptyStringArray(raw.sources)) {
        return false;
      }
      if (raw.drops !== undefined && !isNonEmptyStringArray(raw.drops)) {
        return false;
      }
      if ("ingredients" in entry) return false;
      continue;
    }

    if (!("ingredients" in entry)) return false;
    const recipe = entry as RecipeDefinition;
    if (typeof recipe.ingredients !== "object" || recipe.ingredients === null) {
      return false;
    }
    if (recipe.category !== undefined && (typeof recipe.category !== "string" || !recipe.category.trim())) {
      return false;
    }
    if (recipe.station !== undefined && typeof recipe.station !== "string") {
      return false;
    }
    if (
      recipe.yield !== undefined &&
      (typeof recipe.yield !== "number" ||
        !Number.isInteger(recipe.yield) ||
        recipe.yield < 1)
    ) {
      return false;
    }
    if (
      recipe.techLevel !== undefined &&
      (typeof recipe.techLevel !== "number" ||
        !Number.isFinite(recipe.techLevel) ||
        recipe.techLevel < 0)
    ) {
      return false;
    }
    if (
      recipe.techType !== undefined &&
      recipe.techType !== "standard" &&
      recipe.techType !== "ancient"
    ) {
      return false;
    }
    for (const [ing, qty] of Object.entries(recipe.ingredients)) {
      if (typeof ing !== "string" || typeof qty !== "number" || qty <= 0) {
        return false;
      }
    }
  }

  return true;
}
