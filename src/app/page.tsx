import Link from "next/link";
import { Anvil, GitFork, ListChecks } from "lucide-react";
import { RecipeSearch } from "@/components/RecipeSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCraftableNames, getRawNames } from "@/lib/recipes";

export default function HomePage() {
  const craftables = getCraftableNames().length;
  const raws = getRawNames().length;

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 px-6 py-12 shadow-sm sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,oklch(0.75_0.12_145/0.18),transparent_45%)]" />
        <div className="relative max-w-2xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Palworld crafting companion
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Palcraft
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Expand any recipe into raw materials and intermediate crafts. Search the book, inspect
            dependency trees, and batch a shopping list before you farm.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/calculator">Open Calculator</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/shopping-list">Build Shopping List</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {craftables} craftable recipes · {raws} raw materials in the JSON recipe book
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            href: "/calculator",
            title: "Recipe Calculator",
            description: "Port of the Python expansion logic — raw mats + crafting list.",
            icon: Anvil,
          },
          {
            href: "/tree",
            title: "Crafting Tree",
            description: "Visual dependency graph for any craftable item.",
            icon: GitFork,
          },
          {
            href: "/shopping-list",
            title: "Shopping List",
            description: "Queue multiple targets and merge their material costs.",
            icon: ListChecks,
          },
        ].map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/40">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Browse Recipes</h2>
          <p className="text-muted-foreground">
            Filter by crafted or raw, then jump into the calculator.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <RecipeSearch />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
