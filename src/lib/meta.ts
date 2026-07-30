/** Stamp shown in UI so players know which game data patch recipes target. */
export const GAME_VERSION = "1.0.2";
export const GAME_VERSION_LABEL = `Palworld ${GAME_VERSION}`;
export const DATA_NOTE =
  "Recipe quantities are community-maintained approximations and may differ slightly from the live game.";

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
