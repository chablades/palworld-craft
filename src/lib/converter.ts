import type { RecipeBookData, RecipeEntry } from "@/lib/types";
import { isRecipe, validateRecipeBook } from "@/lib/types";

/**
 * Parse a simple recipe DSL into RecipeBookData.
 *
 * Format:
 *   ITEM_NAME = RAW
 *   ITEM_NAME:
 *     Ingredient: qty
 *     Other Ingredient: qty
 */
export function parseRecipeDsl(text: string): RecipeBookData {
  const recipes: Record<string, RecipeEntry> = {};
  const lines = text.split(/\r?\n/);

  let current: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const rawMatch = line.match(/^(.+?)\s*=\s*RAW$/i);
    if (rawMatch) {
      current = null;
      recipes[rawMatch[1].trim()] = "RAW";
      continue;
    }

    const headerMatch = line.match(/^(.+?):$/);
    if (headerMatch && !line.includes("=")) {
      current = headerMatch[1].trim();
      recipes[current] = { ingredients: {} };
      continue;
    }

    const ingMatch = line.match(/^(.+?):\s*(\d+)\s*$/);
    if (ingMatch && current) {
      const recipe = recipes[current];
      if (isRecipe(recipe)) {
        recipe.ingredients[ingMatch[1].trim()] = Number(ingMatch[2]);
      }
      continue;
    }

    throw new Error(`Invalid recipe DSL at line ${i + 1}: ${rawLine}`);
  }

  const data: RecipeBookData = { recipes };
  if (!validateRecipeBook(data)) {
    throw new Error("Parsed recipe book failed validation");
  }
  return data;
}

/**
 * Best-effort converter for Python-style Recipe(...) snippets.
 * Expects lines similar to:
 *   "Item": Recipe("Item", ("Ing", 1), ("Other", 2)),
 *   "Coal": "RAW",
 *
 * Note: richer RAW objects ({ type: "RAW", sources, drops }) are JSON-only;
 * this converter always emits plain "RAW" strings.
 */
export function parsePythonishRecipes(text: string): RecipeBookData {
  const recipes: Record<string, RecipeEntry> = {};

  const rawRegex = /"([^"]+)"\s*:\s*"RAW"/g;
  let match: RegExpExecArray | null;
  while ((match = rawRegex.exec(text)) !== null) {
    recipes[match[1]] = "RAW";
  }

  const recipeRegex =
    /"([^"]+)"\s*:\s*Recipe\(\s*"([^"]+)"\s*((?:,\s*\(\s*"([^"]+)"\s*,\s*(\d+)\s*\))*)\s*\)/g;

  while ((match = recipeRegex.exec(text)) !== null) {
    const name = match[1];
    const ingredientsBlob = match[3] ?? "";
    const ingredients: Record<string, number> = {};
    const pairRegex = /\(\s*"([^"]+)"\s*,\s*(\d+)\s*\)/g;
    let pair: RegExpExecArray | null;
    while ((pair = pairRegex.exec(ingredientsBlob)) !== null) {
      ingredients[pair[1]] = Number(pair[2]);
    }
    recipes[name] = { ingredients };
  }

  const data: RecipeBookData = { recipes };
  if (!validateRecipeBook(data)) {
    throw new Error("Converted recipe book failed validation");
  }
  return data;
}

export function recipeBookToJson(data: RecipeBookData, pretty = true): string {
  return JSON.stringify(data, null, pretty ? 2 : undefined) + "\n";
}
