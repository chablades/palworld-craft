import { cn } from "@/lib/utils";

const PALETTE = [
  "bg-sky-500/20 text-sky-800 dark:text-sky-200",
  "bg-blue-500/20 text-blue-800 dark:text-blue-200",
  "bg-cyan-500/20 text-cyan-800 dark:text-cyan-200",
  "bg-teal-500/20 text-teal-800 dark:text-teal-200",
  "bg-indigo-500/20 text-indigo-800 dark:text-indigo-200",
  "bg-amber-500/20 text-amber-900 dark:text-amber-200",
  "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200",
  "bg-rose-500/20 text-rose-800 dark:text-rose-200",
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface ItemIconProps {
  name: string;
  className?: string;
  size?: "sm" | "md";
}

/** Colored letter avatar until real Palworld sprites are available. */
export function ItemIcon({ name, className, size = "sm" }: ItemIconProps) {
  const color = PALETTE[hashName(name) % PALETTE.length];
  return (
    <span
      aria-hidden
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md font-semibold tracking-tight",
        size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs",
        color,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
