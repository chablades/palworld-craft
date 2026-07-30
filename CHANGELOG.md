# Changelog

All notable updates to Palcraft are listed here. Newest entries first.

## 2026-07-30

- Expand calculator craft recipes with a clickable show/hide bar under each material
- Compact calculator materials: indented craft tree, (?) info tip, remove Calculate button
- Rebuild calculator as a nested material hierarchy (ingredients with sub-materials underneath)
- Remove Efficiency Tips and separate Raw Materials panel from the calculator
- Calculator shows need/have per material (red if Storage is short, green if enough)
- Restructure app around Calculator, Storage, and Crafting Tree; pause Compare and Shopping List
- Move owned materials to a dedicated Storage tab; calculator always shows full ingredient needs
- Refine crafting tree layout so the looked-up item is the parent with ingredients as children
- Fix calculator totals display: always show required amounts, live-update for qty (e.g. 1× AI Core)
- Lock product focus on Palworld 1.0 (version rule, agent docs, GAME_VERSION stamp)
- Resolve leftover merge conflict markers in the changelog
- Sync recipe data to Palworld 1.0: fix tech levels for 9 components (Carbon Fiber, Circuit Board, Computer, Bio Battery, Corrosive Solvent, Polymer, Plasteel, Thermal Core, AI Core)
- Fix station errors: Bio Battery → Production Assembly Line II, Plasteel → Electric Furnace, AI Core → Advanced Workshop
- Fix Plasteel ingredients (Crude Oil 2 + Ore 5, removing Paldium Fragment) and Pal Metal Ingot ingredients (Ore 4 + Pure Quartz 1 + Paldium Fragment 2)
- Overhaul all 8 sphere recipes (Pal through Ultimate) to current ingredient lists and tech levels; add Sol Sphere (Tech 67)
- Change Hexolite from RAW to craftable (Chromite + Hexolite Quartz at Gigantic Furnace, Tech 58)
- Replace Solarite Ingot RAW entry with Soralite Ingot craftable (Soralite + Pure Quartz at Ancient Furnace, Tech 66)
- Add new RAW items: Chromite, Hardwood, Hexolite Quartz, Soralite
- Bump GAME_VERSION from 0.4.x to 1.0
- Fix calculator/typeahead so Enter and Calculate resolve the typed item and run the plan
- Add Palworld recipe-data agent skill and deep-dive brief for accurate resource totals
- Add AGENTS.md with Cursor Cloud specific setup and run instructions
- Expand recipe book across armor, weapons, spheres, structures, food, ammo, and tools
- Fill remaining raw-material pal-drop metadata
- Add Browse page wiring RecipeSearch into site navigation
- Add print checklist button and print CSS that hides site chrome
- Show aggregate X-of-Y checklist progress on calculator and shopping list
- Document asset policy: keep original placeholders (no official sprites)
- Add installable PWA manifest, icons, and offline service worker
- Add privacy-light Vercel Analytics

## 2026-07-29
- Rename inventory panel to Storage and add Copy JSON export
- Add category-grouped search dropdown and per-item placeholder images
- Replace item dropdowns with typeahead closest-match search
- Add project changelog and Cursor rule to record update + date on every git commit
- Add Impeccable design skill across agent toolchains
- Point docs at palworld-craft
- Add compare, item pages, efficiency tips, and contribute docs
- Add icons, tech unlocks, reverse lookup, favorites, and checklists
- Improve Palcraft calculator home, themes, and Tier 1 UX
- Add Palcraft Next.js recipe calculator website
