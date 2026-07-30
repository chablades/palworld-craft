---
name: palworld-recipe-data
description: Deep-dive Palworld crafting recipe accuracy for Palcraft. Use when verifying or updating recipes.json, fixing wrong material totals, syncing tech levels/stations/sources/drops with current Palworld patch data, or investigating why calculator resource amounts look wrong.
---

# Palworld Recipe Data Agent

You maintain **accurate** crafting data so Palcraft’s calculator can expand real resource costs.

## Target version

**Palworld 1.0 only.** The team plays the 1.0 release line. Do not mix Early Access `0.x` recipes. Keep `GAME_VERSION` on the `1.0` line in [`src/lib/meta.ts`](src/lib/meta.ts).

## Mission

1. Treat [`src/data/recipes.json`](src/data/recipes.json) as the product truth.
2. Verify every craftable against **Palworld 1.0** sources (prefer **paldb.cc**, then palpedia / Fextralife / OP.GG).
3. Fix wrong ingredients, quantities, stations, tech levels, sources, and drops.
4. Keep the dependency graph complete: every ingredient must exist as RAW or craftable.
5. Prove calculations with `calculateRecipe` / `calculateBatch` smoke tests.

## Hard rules

- Do **not** invent recipes. Cite the source URL for each change in the commit/PR body.
- Do **not** rip official game icons (see [`docs/ASSETS.md`](docs/ASSETS.md)).
- Prefer display names that match in-game English (same as existing book style).
- When sources disagree, prefer paldb.cc **1.0** data and note the conflict.
- Keep [`src/lib/meta.ts`](src/lib/meta.ts) `GAME_VERSION` on **1.0** (or a 1.0.x patch stamp) unless the user changes the target.
- Follow the changelog-on-commit rule.

## Workflow

### 1. Baseline audit

```bash
npx tsx -e "
import data from './src/data/recipes.json';
import { validateRecipeBook, isRecipe } from './src/lib/types.ts';
import { calculateRecipe, getCraftableNames, getRecipeEntry } from './src/lib/recipes.ts';
console.log('valid', validateRecipeBook(data));
const missing=[];
for (const n of getCraftableNames()) {
  const e=getRecipeEntry(n);
  if (!isRecipe(e)) continue;
  for (const ing of Object.keys(e.ingredients)) {
    if (!getRecipeEntry(ing)) missing.push([n,ing]);
  }
  try { calculateRecipe(n,1); } catch (err) { console.log('calc', n, err.message); }
}
console.log('missing ingredients', missing);
"
```

### 2. Deep-dive a category (batch)

Work one category at a time: Spheres → Components → Ingots → Weapons → Armor → Ammo → Food → Structures → Tools → Ancient.

For each item:

| Field | Verify |
|-------|--------|
| `ingredients` | Exact names + counts |
| `station` | Exact crafting station |
| `techLevel` / `techType` | Technology unlock |
| RAW `sources` / `drops` | Gather / pal drops |

Primary lookup pattern:

- `https://paldb.cc/en/<Item_Name_With_Underscores>`
- Cross-check: `https://www.palpedia.net/items/<Name>`

### 3. Patch `recipes.json`

- Keep alphabetical key order.
- After edits: `npm run generate-item-placeholders`
- Re-run the baseline audit; every craftable must `calculateRecipe(name, 1)` successfully.

### 4. Spot-check player scenarios

Document before/after totals for at least:

- 20× Thermal Core
- 10× Ultra Sphere (or current high-tier sphere)
- 1× AI Core
- One mid-game weapon + ammo pair

### 5. Ship

- Branch `cursor/palworld-recipe-audit-<suffix>`
- Changelog bullet(s)
- PR lists sources + counts of recipes verified/fixed

## Known accuracy debt (start here)

- `GAME_VERSION` may still say `0.4.x` while live game is past 1.0 / later patches — bump when verifying.
- Many Tier-1 recipes in the book were community approximations; treat tech levels and late-game mats as high-risk.
- Hexolite / Solarite / Plasteel / Polymer chains change across patches — re-verify before trusting endgame totals.
- Structures and food added in bulk expansions need wiki confirmation before players rely on them.

## Out of scope

- UI redesign (unless calculate/submit is broken)
- Official sprite extraction
- Breeding / pal stats (unless needed for drop metadata)

## Success criteria

Players can pick an item + quantity and trust the raw material totals and bottom-up craft order for the stamped game version.
