import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GAME_VERSION_LABEL, GITHUB_REPO_URL } from "@/lib/meta";

export default function ContributePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Contribute</h1>
        <p className="text-muted-foreground">
          Help keep Palcraft accurate for {GAME_VERSION_LABEL}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add or fix recipes</CardTitle>
          <CardDescription>
            All recipes live in a single JSON file so expansions are pull-request friendly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <ol className="list-decimal space-y-2 pl-5 text-foreground">
            <li>
              Edit <code className="rounded bg-muted px-1 py-0.5 text-xs">src/data/recipes.json</code>
            </li>
            <li>
              Craftables use <code className="rounded bg-muted px-1 py-0.5 text-xs">ingredients</code>,
              optional <code className="rounded bg-muted px-1 py-0.5 text-xs">station</code>,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">techLevel</code>, and{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">techType</code>.
            </li>
            <li>
              Raws use{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">{`{ "type": "RAW", "sources": [], "drops": [] }`}</code>
            </li>
            <li>
              Or convert from DSL:{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                npm run convert-recipes -- --input recipes.example.txt --format dsl
              </code>
            </li>
            <li>
              Open a PR against{" "}
              <Link
                href={GITHUB_REPO_URL}
                className="text-primary underline-offset-2 hover:underline"
              >
                github.com/chablades/palworld-craft
              </Link>
            </li>
          </ol>
          <p>
            See also{" "}
            <Link
              href={`${GITHUB_REPO_URL}/blob/main/CONTRIBUTING.md`}
              className="text-primary underline-offset-2 hover:underline"
            >
              CONTRIBUTING.md
            </Link>{" "}
            in the repo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
