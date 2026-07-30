# AGENTS.md

## Cursor Cloud specific instructions

Palcraft is a single Next.js 15 (App Router) + TypeScript app — a static Palworld recipe calculator. There is **no backend, database, or external service**; recipe data is bundled JSON (`src/data/recipes.json`). No env vars are required (`.env.example` is empty).

Standard commands live in `package.json` (`dev`, `build`, `start`, `lint`). Run the dev server with `npm run dev` (serves `http://localhost:3000`).

Non-obvious notes:
- `/calculator` responds with a 307 redirect (to `/` with query params); this is expected, not an error. Test the calculator on `/` or via a shareable URL like `/calculator?item=Thermal%20Core&qty=20`.
- The generated placeholder assets in `public/items/` and PWA icons in `public/icons/` are already committed. Re-running `npm run generate-item-placeholders` / `npm run generate-pwa-icons` is idempotent and typically produces no git diff; only run them if those directories are missing.
- There are **no automated tests** (no Jest/Vitest/Playwright). Quality gates are `npm run lint` and `npm run build`. `next lint` prints a deprecation warning (removed in Next.js 16) but still works.
- Shopping list / inventory / favorites persist in browser `localStorage`, so state carries across reloads in the same browser.
