import { Github } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/meta";

export function GitHubCornerLink() {
  return (
    <a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Palcraft on GitHub"
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/90 px-3 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-border hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Github className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">GitHub</span>
    </a>
  );
}
