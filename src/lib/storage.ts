import type { InventoryMap, ShoppingListItem } from "@/lib/types";

const SHOPPING_KEY = "palcraft:shopping-list";
const INVENTORY_KEY = "palcraft:inventory";
const FAVORITES_KEY = "palcraft:favorites";
const RECENT_KEY = "palcraft:recent";
const CHECKLIST_KEY = "palcraft:checklist";

const MAX_RECENT = 8;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadShoppingList(fallback: ShoppingListItem[] = []): ShoppingListItem[] {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(SHOPPING_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return fallback;
    return parsed
      .filter(
        (item): item is ShoppingListItem =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as ShoppingListItem).name === "string" &&
          typeof (item as ShoppingListItem).amount === "number",
      )
      .map((item) => ({ name: item.name, amount: Math.max(1, item.amount) }));
  } catch {
    return fallback;
  }
}

export function saveShoppingList(items: ShoppingListItem[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(SHOPPING_KEY, JSON.stringify(items));
}

export function loadInventory(fallback: InventoryMap = {}): InventoryMap {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(INVENTORY_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return fallback;
    }
    const result: InventoryMap = {};
    for (const [name, amount] of Object.entries(parsed)) {
      if (typeof amount === "number" && amount > 0) {
        result[name] = Math.floor(amount);
      }
    }
    return result;
  } catch {
    return fallback;
  }
}

export function saveInventory(inventory: InventoryMap): void {
  if (!canUseStorage()) return;
  const cleaned: InventoryMap = {};
  for (const [name, amount] of Object.entries(inventory)) {
    if (amount > 0) cleaned[name] = Math.floor(amount);
  }
  window.localStorage.setItem(INVENTORY_KEY, JSON.stringify(cleaned));
}

function loadStringList(key: string): string[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function loadFavorites(): string[] {
  return loadStringList(FAVORITES_KEY);
}

export function saveFavorites(names: string[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([...new Set(names)]));
}

export function toggleFavorite(name: string): string[] {
  const current = loadFavorites();
  const next = current.includes(name)
    ? current.filter((n) => n !== name)
    : [...current, name];
  saveFavorites(next);
  return next;
}

export function loadRecent(): string[] {
  return loadStringList(RECENT_KEY);
}

export function pushRecent(name: string): string[] {
  const next = [name, ...loadRecent().filter((n) => n !== name)].slice(0, MAX_RECENT);
  if (canUseStorage()) {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }
  return next;
}

export type ChecklistMap = Record<string, boolean>;

export function loadChecklist(planKey: string): ChecklistMap {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(CHECKLIST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    const plan = (parsed as Record<string, unknown>)[planKey];
    if (typeof plan !== "object" || plan === null) return {};
    const result: ChecklistMap = {};
    for (const [name, checked] of Object.entries(plan)) {
      if (typeof checked === "boolean") result[name] = checked;
    }
    return result;
  } catch {
    return {};
  }
}

export function saveChecklist(planKey: string, checklist: ChecklistMap): void {
  if (!canUseStorage()) return;
  let all: Record<string, ChecklistMap> = {};
  try {
    const raw = window.localStorage.getItem(CHECKLIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === "object" && parsed !== null) {
        all = parsed as Record<string, ChecklistMap>;
      }
    }
  } catch {
    all = {};
  }
  all[planKey] = checklist;
  window.localStorage.setItem(CHECKLIST_KEY, JSON.stringify(all));
}
