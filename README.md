# Palcraft — Palworld Recipe Calculator

Next.js + TypeScript website that expands Palworld crafting recipes into raw materials and intermediate crafts. Recipes live in JSON for easy expansion.

## Features

- **Recipe Calculator** — Select an item + quantity, get sorted RAW materials and crafting list
- **Search / Filter** — Browse crafted vs raw items
- **Visual Crafting Tree** — Dependency graph via React Flow
- **Batch Shopping List** — Queue multiple targets and merge costs
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

See [`src/data/recipes.json`](src/data/recipes.json):

```json
{
  "recipes": {
    "Carbon Fiber": {
      "ingredients": {
        "Coal": 2,
        "Flame Organ": 1
      }
    },
    "Coal": "RAW"
  }
}
```

- Craftable items are objects with an `ingredients` map
- Base materials use the string `"RAW"`

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
  lib/                 # Types, calculator, JSON reader, converter
scripts/
  convert-recipes.ts   # CLI converter
```
