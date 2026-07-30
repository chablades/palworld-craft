"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Anvil, Columns2, GitFork, ListChecks, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useElementTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ELEMENT_THEMES, type ElementThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Calculator", icon: Anvil },
  { href: "/browse", label: "Browse", icon: Search },
  { href: "/compare", label: "Compare", icon: Columns2 },
  { href: "/tree", label: "Crafting Tree", icon: GitFork },
  { href: "/shopping-list", label: "Shopping List", icon: ListChecks },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { elementTheme, setElementTheme } = useElementTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="site-chrome sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <Anvil className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg tracking-tight">Palcraft</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Recipe Calculator
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {mounted ? (
            <Select
              value={elementTheme}
              onValueChange={(value) => setElementTheme(value as ElementThemeId)}
            >
              <SelectTrigger
                className="h-9 w-[8.5rem] sm:w-[9.5rem]"
                aria-label="Element theme"
              >
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent align="end">
                {ELEMENT_THEMES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="h-9 w-[8.5rem] rounded-md border border-input sm:w-[9.5rem]" />
          )}
          <Button
            variant="outline"
            size="icon"
            aria-label="Toggle light and dark mode"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-border/40 px-2 py-2 md:hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
