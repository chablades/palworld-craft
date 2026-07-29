/**
 * CLI: convert recipe definitions (DSL or Python-ish) into recipes.json
 *
 * Usage:
 *   npx tsx scripts/convert-recipes.ts --input recipes.txt --format dsl
 *   npx tsx scripts/convert-recipes.ts --input python-snippet.txt --format python
 *   npx tsx scripts/convert-recipes.ts --input recipes.txt --out src/data/recipes.json
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  parsePythonishRecipes,
  parseRecipeDsl,
  recipeBookToJson,
} from "../src/lib/converter";

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function main() {
  const inputPath = getArg("--input") ?? getArg("-i");
  const format = (getArg("--format") ?? getArg("-f") ?? "dsl").toLowerCase();
  const outPath =
    getArg("--out") ?? getArg("-o") ?? resolve(process.cwd(), "src/data/recipes.json");

  if (!inputPath) {
    console.error(
      "Usage: tsx scripts/convert-recipes.ts --input <file> [--format dsl|python] [--out path]",
    );
    process.exit(1);
  }

  const text = readFileSync(resolve(inputPath), "utf8");
  const book =
    format === "python" || format === "pythonish"
      ? parsePythonishRecipes(text)
      : parseRecipeDsl(text);

  const json = recipeBookToJson(book);
  writeFileSync(resolve(outPath), json, "utf8");
  console.log(
    `Wrote ${Object.keys(book.recipes).length} recipes to ${resolve(outPath)}`,
  );
}

main();
