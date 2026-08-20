import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { getAllItemNames, getRecipeBook, getRecipeEntry, getYield, validateRecipeBook } from "@/lib/recipes";
import { findItemBySlug, itemToSlug } from "@/lib/meta";
import { isRecipe } from "@/lib/types";

const book = getRecipeBook();

test("bundled recipe data passes its own schema validation", () => {
  assert.ok(validateRecipeBook(book));
});

test("every ingredient references a defined item", () => {
  const known = new Set(Object.keys(book.recipes));
  const dangling: string[] = [];
  for (const [name, entry] of Object.entries(book.recipes)) {
    if (!isRecipe(entry)) continue;
    for (const ingredient of Object.keys(entry.ingredients)) {
      if (!known.has(ingredient)) dangling.push(`${name} -> ${ingredient}`);
    }
  }
  assert.deepEqual(dangling, [], "undefined ingredients crash the calculator at runtime");
});

test("no recipe depends on itself, directly or transitively", () => {
  const state = new Map<string, "visiting" | "done">();
  const cycles: string[] = [];

  const visit = (name: string, stack: string[]) => {
    const entry = book.recipes[name];
    if (!isRecipe(entry)) return;
    if (state.get(name) === "done") return;
    if (state.get(name) === "visiting") {
      cycles.push([...stack, name].join(" -> "));
      return;
    }
    state.set(name, "visiting");
    for (const ingredient of Object.keys(entry.ingredients)) {
      visit(ingredient, [...stack, name]);
    }
    state.set(name, "done");
  };

  for (const name of Object.keys(book.recipes)) visit(name, []);
  assert.deepEqual(cycles, [], "a cycle makes recipe expansion recurse forever");
});

test("item slugs are unique so /item/[slug] cannot collide", () => {
  const bySlug = new Map<string, string>();
  for (const name of getAllItemNames()) {
    const slug = itemToSlug(name);
    assert.ok(slug.length > 0, `${name} produced an empty slug`);
    const clash = bySlug.get(slug);
    assert.equal(clash, undefined, `${name} and ${clash} share the slug ${slug}`);
    bySlug.set(slug, name);
  }
});

test("every item slug resolves back to its item", () => {
  const names = getAllItemNames();
  for (const name of names) {
    assert.equal(findItemBySlug(itemToSlug(name), names), name);
  }
});

test("every item has a placeholder icon and no icon is orphaned", () => {
  const iconDir = path.join(process.cwd(), "public", "items");
  const icons = new Set(
    readdirSync(iconDir)
      .filter((file) => file.endsWith(".svg"))
      .map((file) => file.slice(0, -".svg".length)),
  );
  const expected = new Set(getAllItemNames().map(itemToSlug));

  const missing = [...expected].filter((slug) => !icons.has(slug));
  const orphaned = [...icons].filter((slug) => !expected.has(slug));

  assert.deepEqual(missing, [], "run `npm run generate-item-placeholders`");
  assert.deepEqual(orphaned, [], "stale icons for items that no longer exist");
});

/**
 * Batch yields audited against paldb.cc (Palworld 1.0); the CHANGELOG records the URL per item.
 * Pinned so a future bulk edit cannot quietly drop or alter a sourced value.
 */
test("audited batch yields stay pinned to their sourced values", () => {
  const sourced: Record<string, number> = {
    Arrow: 10,
    "Fire Arrow": 10,
    "Poison Arrow": 10,
    "Coarse Ammo": 20,
    "Handgun Ammo": 20,
    "Assault Rifle Ammo": 20,
    "Rifle Ammo": 10,
    "Shotgun Shells": 10,
    "Rocket Ammo": 10,
    Nail: 5,
    Cement: 10,
  };

  for (const [name, expected] of Object.entries(sourced)) {
    const entry = getRecipeEntry(name);
    assert.ok(isRecipe(entry), `${name} is no longer a craftable recipe`);
    assert.equal(getYield(entry), expected, `${name} yield drifted from the audited value`);
  }
});
