/** Stamp shown in UI — Palcraft targets the Palworld 1.0 release line. */
export const GAME_VERSION = "1.0";
export const GAME_VERSION_LABEL = `Palworld ${GAME_VERSION}`;
export const DATA_NOTE =
  "Recipe data targets Palworld 1.0. Quantities are community-maintained and may differ slightly from the live game.";

/** Public repo for Palcraft (source, issues, contributions). */
export const GITHUB_REPO_URL = "https://github.com/chablades/palworld-craft";

export function itemToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function findItemBySlug(slug: string, names: string[]): string | undefined {
  const normalized = slug.toLowerCase();
  return names.find((name) => itemToSlug(name) === normalized);
}
