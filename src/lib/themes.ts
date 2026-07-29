export type ElementThemeId =
  | "palworld"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "dark"
  | "dragon"
  | "neutral";

export interface ElementTheme {
  id: ElementThemeId;
  label: string;
}

/** Element themes control accent/palette family; light/dark mode is separate. */
export const ELEMENT_THEMES: readonly ElementTheme[] = [
  { id: "palworld", label: "Palworld" },
  { id: "fire", label: "Fire" },
  { id: "water", label: "Water" },
  { id: "electric", label: "Electric" },
  { id: "grass", label: "Grass" },
  { id: "ice", label: "Ice" },
  { id: "dark", label: "Dark" },
  { id: "dragon", label: "Dragon" },
  { id: "neutral", label: "Neutral" },
] as const;

export const DEFAULT_ELEMENT_THEME: ElementThemeId = "palworld";
export const ELEMENT_THEME_STORAGE_KEY = "palcraft:element-theme";

export function isElementThemeId(value: string): value is ElementThemeId {
  return ELEMENT_THEMES.some((theme) => theme.id === value);
}
