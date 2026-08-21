# Changelog

All notable updates to Palcraft are listed here. Newest entries first.

## 2026-08-20

- Add audited batch yields from paldb.cc (Palworld 1.0), cutting large overestimates:
  Arrow x10, Fire Arrow x10, Poison Arrow x10, Coarse Ammo x20, Handgun Ammo x20,
  Assault Rifle Ammo x20, Rifle Ammo x10, Shotgun Shells x10, Rocket Ammo x10, Nail x5, Cement x10
  (sources: paldb.cc/en/Arrow, /Fire_Arrow, /Poison_Arrow, /Coarse_Ammo, /Handgun_Ammo,
  /Assault_Rifle_Ammo, /Rifle_Ammo, /Shotgun_Shell, /Rocket_Ammo, /Nail, /Cement)
- Verified as single-output and left unchanged: Gunpowder, Ingot, Refined Ingot, Charcoal, Cloth,
  Pal Sphere, Frag Grenade, Shock Grenade (paldb.cc/en/<item>)
- Show spare units on crafting lines when a batch recipe overshoots the plan
- Move exact expansion assertions onto fixtures so sourced recipe corrections cannot break logic tests
- Model craft yields: recipes can declare `yield` (units produced per craft) for batch recipes like arrows and ammo
- Rewrite recipe expansion to pool demand per item and split it into whole crafts once, instead of rounding up separately in each branch
- Pool demand across `calculateBatch` line items so repeated or shared entries share batches
- Make the crafting tree scale ingredients by whole crafts rather than requested units
- Fix Crafting Order panel showing every intermediate as short: Storage now tracks crafted items too, not just raws
- Fix service worker precaching the paused /browse and /shopping-list routes; precache /storage and /tree instead (cache bumped to v2)
- Stop the service worker caching redirect and error responses, which rejected Cache.put()
- Remove the dead Compare button on item pages (Compare is paused and redirects home)
- Drop paused shopping-list wording from the page description and PWA manifest
- Add npm test: 29 node:test cases over recipe expansion, craft yields and batching, craft ordering, inventory offsets, and recipe/asset data integrity

## 2026-07-30

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
