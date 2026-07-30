import { cn } from "@/lib/utils";
import { itemToSlug } from "@/lib/meta";
import { getItemCategory } from "@/lib/recipes";

interface ItemIconProps {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-14 w-14",
} as const;

/** Placeholder item art until real Palworld sprites are available (`/public/items/*.svg`). */
export function ItemIcon({ name, className, size = "sm" }: ItemIconProps) {
  const src = `/items/${itemToSlug(name)}.svg`;
  const category = getItemCategory(name);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- local SVG placeholders; keep lightweight
    <img
      src={src}
      alt=""
      title={`${name} (${category})`}
      width={size === "lg" ? 56 : size === "md" ? 36 : 28}
      height={size === "lg" ? 56 : size === "md" ? 36 : 28}
      loading="lazy"
      decoding="async"
      className={cn(
        "inline-block shrink-0 rounded-md border border-border/50 bg-muted/30 object-cover",
        SIZE[size],
        className,
      )}
    />
  );
}
