import Link from "next/link";
import { DATA_NOTE, GAME_VERSION_LABEL } from "@/lib/meta";

export function SiteFooter() {
  return (
    <footer className="site-chrome border-t border-border/60 mt-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-medium text-foreground">Palcraft</span>
          {" · "}
          Recipes for {GAME_VERSION_LABEL}
        </p>
        <p className="max-w-xl text-xs sm:text-right">
          {DATA_NOTE}{" "}
          <Link href="/contribute" className="underline-offset-2 hover:text-foreground hover:underline">
            Contribute recipes
          </Link>
        </p>
      </div>
    </footer>
  );
}
