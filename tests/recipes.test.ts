import assert from "node:assert/strict";
import test from "node:test";
import {
  applyCraftOffsets,
  applyInventoryOffsets,
  buildCraftingTree,
  calculateBatch,
  calculateRecipe,
  getCraftableNames,
  getRecipeEntry,
  getYield,
  sortedCraftEntries,
} from "@/lib/recipes";
import { isRecipe } from "@/lib/types";
import type { RecipeEntry, TreeNode } from "@/lib/types";

/**
 * Exact expansion maths is asserted against this fixture rather than the bundled book,
 * so a sourced recipe correction cannot break unrelated logic tests. Every recipe here
 * produces one unit per craft; batching lives in yields.test.ts.
 */
const SIMPLE_BOOK: Record<string, RecipeEntry> = {
  Ore: "RAW",
  Stone: "RAW",
  Bone: "RAW",
  Ingot: { ingredients: { Ore: 2 } },
  Nail: { ingredients: { Ingot: 1 } },
  Cement: { ingredients: { Stone: 50, Bone: 1 } },
};

test("expands a single-level recipe into its raws", () => {
  const { raws, crafts } = calculateRecipe("Cement", 1, SIMPLE_BOOK);
  assert.deepEqual(raws, { Stone: 50, Bone: 1 });
  assert.deepEqual(crafts, { Cement: 1 });
});

test("expands nested crafts down to raws and records intermediates", () => {
  // Nail -> Ingot x1 -> Ore x2
  const { raws, crafts } = calculateRecipe("Nail", 1, SIMPLE_BOOK);
  assert.deepEqual(raws, { Ore: 2 });
  assert.deepEqual(crafts, { Nail: 1, Ingot: 1 });
});

test("multiplies nested ingredient quantities, not just the top level", () => {
  const { raws, crafts } = calculateRecipe("Nail", 6, SIMPLE_BOOK);
  assert.deepEqual(raws, { Ore: 12 });
  assert.deepEqual(crafts, { Nail: 6, Ingot: 6 });
});

test("calculateBatch sums plans and skips invalid entries", () => {
  const batch = calculateBatch(
    [
      { name: "Nail", amount: 2 },
      { name: "Nail", amount: 3 },
      { name: "", amount: 4 },
      { name: "Nail", amount: 0 },
    ],
    SIMPLE_BOOK,
  );
  assert.deepEqual(batch.raws, { Ore: 10 });
  assert.deepEqual(batch.crafts, { Nail: 5, Ingot: 5 });
});

test("crafting tree roots the looked-up item with ingredients as children", () => {
  const tree = buildCraftingTree("Nail", 2, SIMPLE_BOOK);
  assert.equal(tree.name, "Nail");
  assert.equal(tree.quantity, 2);
  assert.equal(tree.isRaw, false);
  assert.equal(tree.children.length, 1);

  const ingot = tree.children[0];
  assert.equal(ingot.name, "Ingot");
  assert.equal(ingot.quantity, 2);
  assert.equal(ingot.children[0].name, "Ore");
  assert.equal(ingot.children[0].quantity, 4);
  assert.equal(ingot.children[0].isRaw, true);
});

test("craft offsets read stock for crafted intermediates too", () => {
  const { crafts } = calculateRecipe("Nail", 4, SIMPLE_BOOK);
  const lines = applyCraftOffsets(crafts, { Ingot: 3 });
  const ingot = lines.find((l) => l.name === "Ingot")!;
  assert.equal(ingot.required, 4);
  assert.equal(ingot.owned, 3);
  assert.equal(ingot.remaining, 1);
});

// --- invariants over the real bundled book ---

/** True when expanding this item runs any recipe that produces more than one unit. */
function involvesBatchRecipe(name: string): boolean {
  return Object.keys(calculateRecipe(name, 1).crafts).some((craft) => {
    const entry = getRecipeEntry(craft);
    return isRecipe(entry) && getYield(entry) > 1;
  });
}

test("looking up a raw material yields itself and no crafts", () => {
  const { raws, crafts } = calculateRecipe("Ore", 3);
  assert.deepEqual(raws, { Ore: 3 });
  assert.deepEqual(crafts, {});
});

test("non-positive quantities produce an empty plan", () => {
  assert.deepEqual(calculateRecipe("Nail", 0), { raws: {}, crafts: {}, leftovers: {} });
  assert.deepEqual(calculateRecipe("Nail", -5), { raws: {}, crafts: {}, leftovers: {} });
});

test("unknown items throw rather than silently returning nothing", () => {
  assert.throws(() => calculateRecipe("Nonexistent Widget", 1), /Missing recipe/);
});

test("raw totals scale linearly for chains without a batch recipe", () => {
  let covered = 0;
  for (const name of getCraftableNames()) {
    if (involvesBatchRecipe(name)) continue;
    covered += 1;
    const one = calculateRecipe(name, 1);
    const seven = calculateRecipe(name, 7);
    for (const [raw, qty] of Object.entries(one.raws)) {
      assert.equal(seven.raws[raw], qty * 7, `${name} -> ${raw} did not scale`);
    }
    assert.equal(Object.keys(seven.raws).length, Object.keys(one.raws).length);
  }
  assert.ok(covered > 50, `expected most craftables to be batch-free, only ${covered} were`);
});

test("raw totals never shrink as the requested quantity grows", () => {
  for (const name of getCraftableNames()) {
    const small = calculateRecipe(name, 3);
    const large = calculateRecipe(name, 30);
    for (const [raw, qty] of Object.entries(small.raws)) {
      assert.ok((large.raws[raw] ?? 0) >= qty, `${name} -> ${raw} shrank at a larger quantity`);
    }
  }
});

test("leftovers only ever arise from recipes that declare a batch yield", () => {
  for (const name of getCraftableNames()) {
    for (const [item, spare] of Object.entries(calculateRecipe(name, 3).leftovers)) {
      const entry = getRecipeEntry(item);
      assert.ok(spare > 0, `${name}: ${item} reported a non-positive leftover`);
      assert.ok(
        isRecipe(entry) && getYield(entry) > 1,
        `${name}: ${item} reported ${spare} spare without a batch yield`,
      );
    }
  }
});

test("craft order lists every ingredient before the recipe that consumes it", () => {
  for (const name of getCraftableNames()) {
    const { crafts } = calculateRecipe(name, 1);
    const order = sortedCraftEntries(crafts).map(([n]) => n);
    assert.deepEqual(
      [...order].sort(),
      Object.keys(crafts).sort(),
      `${name}: craft order dropped or duplicated entries`,
    );

    const position = new Map(order.map((n, i) => [n, i]));
    for (const craft of order) {
      const entry = getRecipeEntry(craft);
      if (!isRecipe(entry)) continue;
      for (const ingredient of Object.keys(entry.ingredients)) {
        if (!position.has(ingredient)) continue;
        assert.ok(
          position.get(ingredient)! < position.get(craft)!,
          `${name}: ${ingredient} must be crafted before ${craft}`,
        );
      }
    }
  }
});

test("inventory offsets clamp remaining at zero and sort alphabetically", () => {
  const lines = applyInventoryOffsets(
    { Stone: 50, Bone: 1, "Pal Fluids": 1 },
    { Stone: 20, Bone: 99, Ore: 5 },
  );
  assert.deepEqual(
    lines.map((l) => l.name),
    ["Bone", "Pal Fluids", "Stone"],
  );
  assert.deepEqual(lines.find((l) => l.name === "Stone"), {
    name: "Stone",
    required: 50,
    owned: 20,
    remaining: 30,
  });
  assert.deepEqual(lines.find((l) => l.name === "Bone"), {
    name: "Bone",
    required: 1,
    owned: 99,
    remaining: 0,
  });
  assert.equal(lines.find((l) => l.name === "Pal Fluids")!.owned, 0);
});

test("negative stored amounts are treated as zero owned", () => {
  const [line] = applyInventoryOffsets({ Ore: 4 }, { Ore: -10 });
  assert.equal(line.owned, 0);
  assert.equal(line.remaining, 4);
});

test("crafting tree node ids are unique so graph layout cannot collide", () => {
  for (const name of getCraftableNames()) {
    const seen = new Set<string>();
    const walk = (node: TreeNode) => {
      assert.ok(!seen.has(node.id), `${name}: duplicate tree node id ${node.id}`);
      seen.add(node.id);
      node.children.forEach(walk);
    };
    walk(buildCraftingTree(name, 1));
  }
});
