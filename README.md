# Palcraft — Palworld Recipe Calculator

Next.js + TypeScript website that expands Palworld crafting recipes into raw materials and intermediate crafts. Recipes live in JSON for easy expansion.

## Features

- **Recipe Calculator** — Select an item + quantity, get raw materials and a bottom-up crafting order
- **Inventory offsets** — Enter amounts you already own; remaining needs update automatically
- **Search / Filter** — Browse crafted vs raw items
- **Visual Crafting Tree** — Dependency graph via React Flow (`/tree?item=...`)
- **Batch Shopping List** — Queue multiple targets and merge costs (persisted in `localStorage`)
- **Compare** — Side-by-side material costs for two craftables
- **Per-item pages** — Dedicated recipe pages at `/item/...`
- **Efficiency tips** — Station and workflow hints on calculator and shopping list
- **Favorites / checklists** — Star items and track shopping progress
- **Share & copy** — Query-string plan URLs plus plain text / Markdown export
- **Material sources** — Sources and pal-drop hints on raw materials
- **Game version stamp** — Footer shows which Palworld patch the data targets
- **Contribute docs** — CONTRIBUTING.md and `/contribute` for recipe PRs
- **JSON reader + converter CLI** — Expand the recipe book without touching app code

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui-style components
- `@xyflow/react` for the crafting tree
- Deployable on Vercel

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Recipe JSON format

See [`src/data/recipes.json`](src/data/recipes.json).

### Craftables

Objects with an `ingredients` map and optional `station`:

```json
{
  "Carbon Fiber": {
    "station": "Production Assembly Line",
    "ingredients": {
      "Coal": 2,
      "Flame Organ": 1
    }
  }
}
```

### Raw materials

Backward compatible: the string `"RAW"` still works.

Richer form (optional metadata):

```json
{
  "Coal": {
    "type": "RAW",
    "sources": ["Mining", "Ore deposits", "Coal Mine"],
    "drops": ["Digtoise", "Dumud"]
  }
}
```

- `sources` — where to gather the material (mining, chests, merchants, etc.)
- `drops` — pals known to drop it
- Plain `"RAW"` strings remain valid and need no migration

## Shareable URLs

**Calculator:** `/calculator?item=Thermal%20Core&qty=20&inv=Coal:40,Flame%20Organ:5`

**Shopping list:** `/shopping-list?list=Thermal%20Core:20,Computer:2&inv=Coal:40`

- `item` / `qty` — single calculator target
- `list` — comma-separated `Name:amount` pairs for the shopping queue
- `inv` — owned inventory as `Name:amount` pairs (shared across calculator and shopping list via `localStorage`)

## Convert recipes to JSON

DSL example (`recipes.example.txt`):

```text
Coal = RAW
Flame Organ = RAW

Carbon Fiber:
  Coal: 2
  Flame Organ: 1
```

```bash
npm run convert-recipes -- --input recipes.example.txt --format dsl --out src/data/recipes.json
```

Python-ish Recipe() snippets are also supported with `--format python`.

The DSL converter still emits plain `"RAW"` strings. Enrich sources/drops by editing the JSON afterward.

## Deploy on Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Framework preset: **Next.js** (auto-detected)
4. Deploy — no env vars required for the static recipe book

Or from the CLI:

```bash
npx vercel
```

## Project layout

```
src/
  app/                 # Pages (home, calculator, tree, shopping-list)
  components/          # Feature UI + shadcn primitives
  data/recipes.json    # Recipe book
  lib/                 # Types, calculator, share/storage helpers, converter
scripts/
  convert-recipes.ts   # CLI converter
```
