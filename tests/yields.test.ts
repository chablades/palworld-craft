import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCraftingTree,
  calculateBatch,
  calculateRecipe,
  getYield,
  validateRecipeBook,
} from "@/lib/recipes";
import type { RecipeEntry } from "@/lib/types";

/**
 * Synthetic fixture, not Palworld data — real yields must be sourced per
 * .agents/skills/palworld-recipe-data/SKILL.md. Shapes the two cases that matter:
 * a batch recipe (Gunpowder x5) shared by two consumers, over a second batch
 * recipe (Charcoal x3) so rounding has to compose.
 */
const BATCH_BOOK: Record<string, RecipeEntry> = {
  Wood: "RAW",
  Sulfur: "RAW",
  Charcoal: { ingredients: { Wood: 2 }, yield: 3 },
  Gunpowder: { ingredients: { Charcoal: 2, Sulfur: 1 }, yield: 5 },
  "Coarse Ammo": { ingredients: { Gunpowder: 1 } },
  "Handgun Ammo": { ingredients: { Gunpowder: 1 } },
  Bandolier: { ingredients: { "Coarse Ammo": 1, "Handgun Ammo": 1 } },
};

test("a partial batch still costs one whole craft", () => {
  // 1 Gunpowder still runs a full batch of 5, which needs 2 Charcoal -> 1 batch of 3.
  const { raws, crafts } = calculateRecipe("Gunpowder", 1, BATCH_BOOK);
  assert.deepEqual(crafts, { Gunpowder: 5, Charcoal: 3 });
  assert.deepEqual(raws, { Wood: 2, Sulfur: 1 });
});

test("an exact multiple of the yield produces no overshoot", () => {
  const { raws, crafts } = calculateRecipe("Gunpowder", 10, BATCH_BOOK);
  assert.deepEqual(crafts, { Gunpowder: 10, Charcoal: 6 });
  assert.deepEqual(raws, { Wood: 4, Sulfur: 2 });
});

test("a batch shared by two consumers rounds up once, not once per consumer", () => {
  // Bandolier needs 1 Gunpowder via Coarse Ammo and 1 via Handgun Ammo.
  // Pooled: 2 needed -> one batch of 5. Per-branch rounding would run two
  // batches and double every downstream raw.
  const { raws, crafts } = calculateRecipe("Bandolier", 1, BATCH_BOOK);
  assert.equal(crafts.Gunpowder, 5, "gunpowder must be batched once for the pooled demand");
  assert.equal(crafts.Charcoal, 3);
  assert.deepEqual(raws, { Wood: 2, Sulfur: 1 });
});

test("calculateBatch pools demand across separate line items", () => {
  const separate = calculateBatch(
    [
      { name: "Coarse Ammo", amount: 1 },
      { name: "Handgun Ammo", amount: 1 },
    ],
    BATCH_BOOK,
  );
  assert.equal(separate.crafts.Gunpowder, 5);
  assert.deepEqual(separate.raws, { Wood: 2, Sulfur: 1 });
});

test("calculateBatch pools repeated entries of the same item", () => {
  const pooled = calculateBatch(
    [
      { name: "Gunpowder", amount: 1 },
      { name: "Gunpowder", amount: 1 },
    ],
    BATCH_BOOK,
  );
  assert.equal(pooled.crafts.Gunpowder, 5, "two entries of 1 share a single batch");
});

test("crafting tree scales children by whole crafts, not requested units", () => {
  // 6 Gunpowder -> 2 batches -> 4 Charcoal + 2 Sulfur; 4 Charcoal -> 2 batches -> 4 Wood.
  const tree = buildCraftingTree("Gunpowder", 6, BATCH_BOOK);
  assert.equal(tree.quantity, 6);

  const charcoal = tree.children.find((c) => c.name === "Charcoal")!;
  const sulfur = tree.children.find((c) => c.name === "Sulfur")!;
  assert.equal(charcoal.quantity, 4);
  assert.equal(sulfur.quantity, 2);
  assert.equal(charcoal.children[0].name, "Wood");
  assert.equal(charcoal.children[0].quantity, 4);
});

test("leftovers record the overshoot of every partial batch", () => {
  // Gunpowder: 1 needed, 5 produced -> 4 spare. Charcoal: 2 needed, 3 produced -> 1 spare.
  const { leftovers } = calculateRecipe("Gunpowder", 1, BATCH_BOOK);
  assert.deepEqual(leftovers, { Gunpowder: 4, Charcoal: 1 });
});

test("leftovers cover only the levels that actually overshoot", () => {
  // 10 Gunpowder is exactly two batches, but its 4 Charcoal needs two batches of 3.
  const { leftovers } = calculateRecipe("Gunpowder", 10, BATCH_BOOK);
  assert.deepEqual(leftovers, { Charcoal: 2 });
});

test("an explicit yield of 1 matches an omitted yield", () => {
  const implicit: Record<string, RecipeEntry> = {
    Ore: "RAW",
    Ingot: { ingredients: { Ore: 2 } },
  };
  const explicit: Record<string, RecipeEntry> = {
    Ore: "RAW",
    Ingot: { ingredients: { Ore: 2 }, yield: 1 },
  };
  assert.deepEqual(calculateRecipe("Ingot", 7, implicit), calculateRecipe("Ingot", 7, explicit));
});

test("getYield defaults to one and honours a declared yield", () => {
  assert.equal(getYield({ ingredients: { Wood: 1 } }), 1);
  assert.equal(getYield({ ingredients: { Wood: 1 }, yield: 5 }), 5);
});

test("schema validation rejects yields that are not positive integers", () => {
  const withYield = (value: unknown) => ({
    recipes: { Wood: "RAW", Plank: { ingredients: { Wood: 1 }, yield: value } },
  });
  assert.equal(validateRecipeBook(withYield(4)), true);
  assert.equal(validateRecipeBook(withYield(0)), false);
  assert.equal(validateRecipeBook(withYield(-2)), false);
  assert.equal(validateRecipeBook(withYield(1.5)), false);
  assert.equal(validateRecipeBook(withYield("3")), false);
});
