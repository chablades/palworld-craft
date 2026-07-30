# Contributing to Palcraft

Thanks for helping keep Palworld recipe data accurate.

## Recipe data

Primary source of truth: [`src/data/recipes.json`](src/data/recipes.json)

### Craftable item

```json
"Carbon Fiber": {
  "station": "Production Assembly Line",
  "techLevel": 18,
  "category": "Components",
  "ingredients": {
    "Coal": 2,
    "Flame Organ": 1
  }
}
```

### Raw material

```json
"Coal": {
  "type": "RAW",
  "category": "Ores",
  "sources": ["Mining", "Coal Mine"],
  "drops": ["Digtoise"]
}
```

Use a `category` such as `Ores`, `Pal Materials`, `Ingots`, `Components`, `Weapons`, etc. Categories appear as alphabetical section headers in item pickers.

## Converter CLI

```bash
npm run convert-recipes -- --input recipes.example.txt --format dsl --out src/data/recipes.json
```

Python-ish `Recipe(...)` snippets work with `--format python`.

## Pull requests

1. Keep recipe names consistent with in-game English names.
2. Prefer verified ingredient counts from the live game when possible.
3. Run `npm run build` before opening a PR.
4. Note the game patch you checked against in the PR description.
