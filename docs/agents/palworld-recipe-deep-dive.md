# Agent brief: Palworld recipe deep dive

**Goal:** Make Palcraft’s calculator trustworthy for real resource planning on **Palworld 1.0**.

**Skill to follow:** [`.cursor/skills/palworld-recipe-data/SKILL.md`](../skills/palworld-recipe-data/SKILL.md)

## Target version

**Palworld 1.0** — this is the game version the team is on. Do not use Early Access `0.x` recipe values.

## Why this agent exists

The expander math works, but totals are only as good as [`src/data/recipes.json`](../../src/data/recipes.json). Bulk/community approximations (wrong tech levels, stations, or ingredient counts) make the calculator feel “broken” for farming plans.

## First sprint

1. Confirm `GAME_VERSION` stays on the **1.0** line.
2. Verify + fix the **Ancient / endgame** chain: Thermal Core, AI Core, Corrosive Solvent, Hexolite, Polymer, Carbon Fiber, Circuit Board, Computer, Plasteel.
3. Verify **sphere** ladder (Pal → Mega → Giga → Ultra → Legendary → Exotic/Ultimate / Sol if valid in 1.0).
4. Re-run calculate smoke tests; document sample totals in the PR.
5. Continue category-by-category until the full book is sourced against 1.0.

## Launch prompt (paste into a new agent)

```text
Follow .cursor/skills/palworld-recipe-data/SKILL.md and docs/agents/palworld-recipe-deep-dive.md.

Deep-dive Palworld 1.0 crafting data so the Palcraft calculator returns accurate resource totals.
Verify against paldb.cc 1.0 sources (not EA 0.x). Fix recipes.json, regenerate placeholders,
keep GAME_VERSION on 1.0, changelog + PR with cited sources and before/after sample totals.
Do not ship ripped game icons.
```
