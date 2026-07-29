import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemIcon } from "@/components/ItemIcon";
import { MaterialMeta } from "@/components/MaterialMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAllItemNames,
  getRecipeEntry,
  getStation,
  getTechInfo,
  getUsedBy,
} from "@/lib/recipes";
import { findItemBySlug, itemToSlug } from "@/lib/meta";
import { isRaw, isRecipe } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllItemNames().map((name) => ({ slug: itemToSlug(name) }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const name = findItemBySlug(slug, getAllItemNames());
  if (!name) return { title: "Item not found | Palcraft" };
  return {
    title: `${name} | Palcraft`,
    description: `Palworld recipe, materials, and uses for ${name}.`,
  };
}

export default async function ItemPage({ params }: PageProps) {
  const { slug } = await params;
  const name = findItemBySlug(slug, getAllItemNames());
  if (!name) notFound();

  const entry = getRecipeEntry(name);
  const raw = isRaw(entry);
  const recipe = isRecipe(entry) ? entry : null;
  const usedBy = getUsedBy(name);
  const station = getStation(name);
  const tech = getTechInfo(name);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <ItemIcon name={name} size="md" />
          <div>
            <h1 className="font-display text-3xl tracking-tight">{name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={raw ? "raw" : "crafted"}>{raw ? "RAW" : "Crafted"}</Badge>
              {station && <Badge variant="outline">{station}</Badge>}
              {tech?.techLevel !== undefined && (
                <Badge variant="secondary">
                  {tech.techType === "ancient" ? "Ancient Tech" : "Tech"} Lv {tech.techLevel}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!raw && (
            <>
              <Button asChild>
                <Link href={`/?item=${encodeURIComponent(name)}`}>Open in calculator</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/tree?item=${encodeURIComponent(name)}`}>Crafting tree</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/compare?left=${encodeURIComponent(name)}`}>Compare</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {recipe && (
        <Card>
          <CardHeader>
            <CardTitle>Recipe</CardTitle>
            <CardDescription>
              Direct ingredients{station ? ` at ${station}` : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {Object.entries(recipe.ingredients).map(([ing, qty]) => (
                <li
                  key={ing}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <Link
                    href={`/item/${itemToSlug(ing)}`}
                    className="inline-flex items-center gap-2 hover:underline"
                  >
                    <ItemIcon name={ing} />
                    {ing}
                  </Link>
                  <span className="font-mono tabular-nums">×{qty}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {raw && (
        <Card>
          <CardHeader>
            <CardTitle>How to obtain</CardTitle>
          </CardHeader>
          <CardContent>
            <MaterialMeta name={name} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Used by
            <Badge variant="secondary">{usedBy.length}</Badge>
          </CardTitle>
          <CardDescription>Recipes that consume this item directly.</CardDescription>
        </CardHeader>
        <CardContent>
          {usedBy.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No known recipes use this item yet.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {usedBy.map((parent) => (
                <li key={parent}>
                  <Link
                    href={`/item/${itemToSlug(parent)}`}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
                  >
                    <ItemIcon name={parent} />
                    {parent}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
