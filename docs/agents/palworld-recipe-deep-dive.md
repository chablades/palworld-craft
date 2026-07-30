# Agent brief: Palworld recipe deep dive

**Goal:** Make Palcraft’s calculator trustworthy for real resource planning.

**Skill to follow:** [`.cursor/skills/palworld-recipe-data/SKILL.md`](../skills/palworld-recipe-data/SKILL.md)

## Why this agent exists

The expander math works, but totals are only as good as [`src/data/recipes.json`](../../src/data/recipes.json). Bulk/community approximations (wrong tech levels, stations, or ingredient counts) make the calculator feel “broken” for farming plans.

## First sprint

1. Bump/confirm `GAME_VERSION` against current Palworld patch.
2. Verify + fix the **Ancient / endgame** chain: Thermal Core, AI Core, Corrosive Solvent, Hexolite, Polymer, Carbon Fiber, Circuit Board, Computer, Plasteel.
3. Verify **sphere** ladder (Pal → Mega → Giga → Ultra → Legendary → Exotic/Ultimate if still valid).
4. Re-run calculate smoke tests; document sample totals in the PR.
5. Continue category-by-category until the full book is sourced.

## Launch prompt (paste into a new agent)

```text
Follow .cursor/skills/palworld-recipe-data/SKILL.md and docs/agents/palworld-recipe-deep-dive.md.

Deep-dive Palworld crafting data so the Palcraft calculator returns accurate resource totals.
Start with endgame/Ancient + sphere chains against paldb.cc, fix recipes.json, regenerate placeholders,
update GAME_VERSION if needed, changelog + PR with cited sources and before/after sample totals.
Do not ship ripped game icons.
```
