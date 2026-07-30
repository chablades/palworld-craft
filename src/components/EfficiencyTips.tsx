import Link from "next/link";
import { Layers } from "lucide-react";
import { ItemIcon } from "@/components/ItemIcon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findSharedIntermediates } from "@/lib/compare";
import { itemToSlug } from "@/lib/meta";

interface EfficiencyTipsProps {
  crafts: Record<string, number>;
}

export function EfficiencyTips({ crafts }: EfficiencyTipsProps) {
  const tips = findSharedIntermediates(crafts, 2);
  if (tips.length === 0) return null;

  return (
    <Card className="border-primary/25 bg-primary/5 print:hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4 text-primary" />
          Efficiency tips
        </CardTitle>
        <CardDescription>
          These intermediates appear in bulk — craft them once in a large batch before dependents.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tips.slice(0, 8).map((tip) => (
            <li
              key={tip.name}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-card/70 px-3 py-2 text-sm"
            >
              <Link
                href={`/item/${itemToSlug(tip.name)}`}
                className="inline-flex items-center gap-2 font-medium hover:underline"
              >
                <ItemIcon name={tip.name} />
                {tip.name}
              </Link>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                ×{tip.quantity}
                {tip.usedBy.length > 0
                  ? ` · used by ${tip.usedBy.slice(0, 3).join(", ")}${
                      tip.usedBy.length > 3 ? "…" : ""
                    }`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
