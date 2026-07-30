# Palcraft — Palworld Recipe Calculator

Next.js + TypeScript website that expands Palworld crafting recipes into raw materials and intermediate crafts. Recipes live in JSON for easy expansion. **Data targets Palworld 1.0.**

## Features

- **Recipe Calculator** — Main page: pick an item + quantity and see full ingredient needs (raws + crafts)
- **Storage** — Separate tab to log owned Pal materials / raws (`/storage`); does not alter calculator totals
- **Crafting Tree** — Looked-up item is the parent node; ingredients fan out as children (`/tree?item=...`)
- **Per-item pages** — Dedicated recipe pages at `/item/...`
- **Favorites / checklists** — Star items and check off gathering progress
- **Share & copy** — Query-string plan URLs plus plain text / Markdown / JSON export
- **Material sources** — Sources and pal-drop hints on raw materials
- **Game version stamp** — Footer shows Palworld **1.0** (the release line this book targets)
- **PWA** — Installable offline shell (manifest + service worker)
- **Contribute docs** — CONTRIBUTING.md and `/contribute` for recipe PRs
- **JSON reader + converter CLI** — Expand the recipe book without touching app code

Paused for now: Compare and Shopping List (old URLs redirect to the calculator).

## Agent skills

- [`.cursor/skills/palworld-recipe-data`](.cursor/skills/palworld-recipe-data/SKILL.md) — deep-dive / verify recipe accuracy against paldb.cc
- Brief: [`docs/agents/palworld-recipe-deep-dive.md`](docs/agents/palworld-recipe-deep-dive.md)

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui-style components
- `@xyflow/react` for the crafting tree
- `@vercel/analytics` (privacy-light page analytics)
- Deployable on Vercel

## Getting started

```bash
npm install
npm run generate-item-placeholders
npm run generate-pwa-icons
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Asset policy

Item icons are original placeholders. Official Palworld art is not redistributed — see [`docs/ASSETS.md`](docs/ASSETS.md).

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

**Crafting tree:** `/tree?item=AI%20Core&qty=1`

- `item` / `qty` — calculator or tree target
- Owned materials are tracked on `/storage` (browser `localStorage`), separate from calculator totals

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
  app/                 # Pages (home/calculator, storage, tree, item, …)
  components/          # Feature UI + shadcn primitives
  data/recipes.json    # Recipe book
  lib/                 # Types, calculator, share/storage helpers, converter
scripts/
  convert-recipes.ts   # CLI converter
  expand-recipes.mjs   # Curated batch expansion helper
  generate-item-placeholders.mjs
  generate-pwa-icons.mjs
docs/
  ASSETS.md            # Icon / trademark policy
```
