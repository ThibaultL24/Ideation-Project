// src/components/workshop/card-grid.tsx
"use client";

import type { CardLevel, WorkshopCard } from "@/lib/workshop/card-tree";

interface CardGridProps {
  level: CardLevel;
  depth: number;
  maxDepth: number;
  onPick: (card: WorkshopCard) => void;
  disabled?: boolean;
}

export function CardGrid({ level, depth, maxDepth, onPick, disabled }: CardGridProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
          Affinage {depth + 1} / {maxDepth}
        </p>
        <span className="text-xs text-[var(--muted)]">{level.id}</span>
      </div>
      <h2 className="text-xl font-bold md:text-2xl">{level.question}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {level.cards.map((card) => (
          <button
            key={card.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(card)}
            className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-left transition hover:border-[var(--accent)] hover:shadow-[0_0_24px_-8px_var(--accent)] disabled:opacity-50"
          >
            <span className="text-lg font-semibold group-hover:text-[var(--accent)]">
              {card.title}
            </span>
            <p className="mt-2 text-sm text-[var(--muted)]">{card.subtitle}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
