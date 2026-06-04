// src/components/brainstorm/popular-idea-card.tsx
import Link from "next/link";
import type { PopularIdeaInCategory } from "@/lib/ideas/category-popular";
import { categoryToSlug } from "@/lib/ideas/category";

function formatShares(shares: number): string {
  if (shares <= 0) return "—";
  if (shares >= 1_000_000) return `${(shares / 1_000_000).toFixed(1)}M parts`;
  if (shares >= 1_000) return `${(shares / 1_000).toFixed(1)}k parts`;
  return `${shares} parts`;
}

interface PopularIdeaCardProps {
  row: PopularIdeaInCategory;
}

export function PopularIdeaCard({ row }: PopularIdeaCardProps) {
  const categorySlug = categoryToSlug(row.idea.category);
  const href = `/brainstorm/category/${categorySlug}/${row.idea.slug}`;

  return (
    <Link
      href={href}
      className="flex h-full min-h-[200px] flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--accent)]"
    >
      <h3 className="line-clamp-2 text-lg font-semibold">{row.idea.title}</h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-[var(--muted)]">
        {row.idea.tagline}
      </p>
      <p className="mt-4 text-xs text-[var(--accent)]">
        Popularité · {formatShares(row.totalShares)}
      </p>
    </Link>
  );
}
