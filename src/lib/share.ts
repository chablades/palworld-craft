import type { InventoryMap, OffsetLine, ShoppingListItem } from "@/lib/types";

export function encodeInventoryParam(inventory: InventoryMap): string {
  return Object.entries(inventory)
    .filter(([, amount]) => amount > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, amount]) => `${name}:${amount}`)
    .join(",");
}

export function parseInventoryParam(value: string | null): InventoryMap {
  if (!value) return {};
  const result: InventoryMap = {};
  for (const part of value.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const colon = trimmed.lastIndexOf(":");
    if (colon <= 0) continue;
    const name = trimmed.slice(0, colon).trim();
    const amount = Number(trimmed.slice(colon + 1));
    if (!name || !Number.isFinite(amount) || amount <= 0) continue;
    result[name] = Math.floor(amount);
  }
  return result;
}

export function encodeListParam(items: ShoppingListItem[]): string {
  return items
    .filter((item) => item.name && item.amount > 0)
    .map((item) => `${item.name}:${item.amount}`)
    .join(",");
}

export function parseListParam(value: string | null): ShoppingListItem[] {
  if (!value) return [];
  const items: ShoppingListItem[] = [];
  for (const part of value.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const colon = trimmed.lastIndexOf(":");
    if (colon <= 0) continue;
    const name = trimmed.slice(0, colon).trim();
    const amount = Number(trimmed.slice(colon + 1));
    if (!name || !Number.isFinite(amount) || amount <= 0) continue;
    items.push({ name, amount: Math.floor(amount) });
  }
  return items;
}

export function buildShareSearchParams(options: {
  item?: string;
  qty?: number;
  list?: ShoppingListItem[];
  inventory?: InventoryMap;
}): URLSearchParams {
  const params = new URLSearchParams();
  if (options.item) params.set("item", options.item);
  if (options.qty !== undefined && options.qty > 0) {
    params.set("qty", String(options.qty));
  }
  if (options.list && options.list.length > 0) {
    params.set("list", encodeListParam(options.list));
  }
  const inv = options.inventory ? encodeInventoryParam(options.inventory) : "";
  if (inv) params.set("inv", inv);
  return params;
}

export interface ExportSections {
  title: string;
  raws: OffsetLine[];
  crafts: OffsetLine[];
}

export function formatResultsPlain(sections: ExportSections): string {
  const lines: string[] = [sections.title, ""];
  lines.push("Raw materials (remaining / required):");
  if (sections.raws.length === 0) {
    lines.push("- None");
  } else {
    for (const line of sections.raws) {
      lines.push(
        `- ${line.name}: ${line.remaining} remaining (${line.required} required, ${line.owned} owned)`,
      );
    }
  }
  lines.push("");
  lines.push("Craft order (remaining / required):");
  if (sections.crafts.length === 0) {
    lines.push("- None");
  } else {
    for (const [index, line] of sections.crafts.entries()) {
      lines.push(
        `${index + 1}. ${line.name}: ${line.remaining} remaining (${line.required} required, ${line.owned} owned)`,
      );
    }
  }
  return lines.join("\n");
}

export function formatResultsMarkdown(sections: ExportSections): string {
  const lines: string[] = [`# ${sections.title}`, ""];
  lines.push("## Raw materials");
  lines.push("");
  if (sections.raws.length === 0) {
    lines.push("_None_");
  } else {
    lines.push("| Item | Remaining | Required | Owned |");
    lines.push("| --- | ---: | ---: | ---: |");
    for (const line of sections.raws) {
      lines.push(
        `| ${line.name} | ${line.remaining} | ${line.required} | ${line.owned} |`,
      );
    }
  }
  lines.push("");
  lines.push("## Craft order");
  lines.push("");
  if (sections.crafts.length === 0) {
    lines.push("_None_");
  } else {
    for (const [index, line] of sections.crafts.entries()) {
      lines.push(
        `${index + 1}. **${line.name}** — ${line.remaining} remaining (${line.required} required, ${line.owned} owned)`,
      );
    }
  }
  return lines.join("\n");
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
