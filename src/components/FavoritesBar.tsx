"use client";

import { Star } from "lucide-react";
import { ItemIcon } from "@/components/ItemIcon";
import { Button } from "@/components/ui/button";

interface FavoritesBarProps {
  favorites: string[];
  recent: string[];
  selected?: string;
  onSelect: (name: string) => void;
  onToggleFavorite: (name: string) => void;
}

export function FavoritesBar({
  favorites,
  recent,
  selected,
  onSelect,
  onToggleFavorite,
}: FavoritesBarProps) {
  if (favorites.length === 0 && recent.length === 0) return null;

  return (
    <div className="space-y-3 print:hidden">
      {favorites.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Favorites
          </p>
          <div className="flex flex-wrap gap-2">
            {favorites.map((name) => (
              <div key={name} className="inline-flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={selected === name ? "default" : "outline"}
                  className="gap-2"
                  onClick={() => onSelect(name)}
                >
                  <ItemIcon name={name} />
                  <span className="max-w-[10rem] truncate">{name}</span>
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label={`Unfavorite ${name}`}
                  onClick={() => onToggleFavorite(name)}
                >
                  <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent
          </p>
          <div className="flex flex-wrap gap-2">
            {recent.map((name) => (
              <Button
                key={name}
                type="button"
                size="sm"
                variant={selected === name ? "secondary" : "ghost"}
                className="gap-2 border border-border/60"
                onClick={() => onSelect(name)}
              >
                <ItemIcon name={name} />
                <span className="max-w-[10rem] truncate">{name}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
