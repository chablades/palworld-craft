import type { InventoryMap, ShoppingListItem } from "@/lib/types";

const SHOPPING_KEY = "palcraft:shopping-list";
const INVENTORY_KEY = "palcraft:inventory";

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
