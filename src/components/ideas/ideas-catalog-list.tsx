// src/components/ideas/ideas-catalog-list.tsx
"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  loadLocalCommunityIdeas,
  mergeCommunityIntoCatalog,
} from "@/lib/ideas/community-catalog";
import type { Idea } from "@/lib/ideas/schema";

interface IdeasCatalogListProps {
  ideas: Idea[];
  category?: string;
}

export function IdeasCatalogList({ ideas, category }: IdeasCatalogListProps) {
  const [localCommunity, setLocalCommunity] = useState<Idea[]>([]);

  useEffect(() => {
    setLocalCommunity(loadLocalCommunityIdeas());
  }, []);

  const merged = useMemo(
    () => mergeCommunityIntoCatalog(ideas, localCommunity),
    [ideas, localCommunity],
  );

  const filtered = useMemo(
    () =>
      category ? merged.filter((idea) => idea.category === category) : merged,
    [merged, category],
  );

  const categories = useMemo(
    () =>
      [...new Set(merged.map((idea) => idea.category))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [merged],
  );

  return (
    <>
      <p className="text-sm text-[var(--muted)]">
        {filtered.length} project{filtered.length !== 1 ? "s" : ""}
        {category ? ` · ${category}` : ""}
      </p>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/ideas"
          className={`rounded-full border px-3 py-1 text-xs ${
            !category
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-[var(--border)] text-[var(--muted)]"
          }`}
        >
          All
        </Link>
        {categories.map((item) => (
          <Link
            key={item}
            href={`/ideas?category=${encodeURIComponent(item)}`}
            className={`rounded-full border px-3 py-1 text-xs ${
              category === item
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted)]"
            }`}
          >
            {item}
          </Link>
        ))}
      </div>

      <ul className="grid gap-3">
        {filtered.map((idea) => (
          <li key={idea.canonicalId}>
            <Link
              href={`/ideas/${idea.slug}`}
              className="block rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--accent)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{idea.title}</h2>
                {idea.github?.prUrl ? (
                  <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
                    PR
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">
                {idea.description}
              </p>
              <p className="mt-2 text-xs text-[var(--accent)]">{idea.category}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
