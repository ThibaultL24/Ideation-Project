// src/app/brainstorm/category/[categorySlug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { PopularIdeaCard } from "@/components/brainstorm/popular-idea-card";
import { categoryFromSlug, categoryToSlug } from "@/lib/ideas/category";
import { getPopularIdeasInCategory } from "@/lib/ideas/category-popular";
import { getCategories, loadNormalizedIdeas } from "@/lib/ideas/load";

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
}

export default async function BrainstormCategoryPage({
  params,
}: CategoryPageProps) {
  const { categorySlug } = await params;
  const ideas = loadNormalizedIdeas();
  const categories = getCategories(ideas);
  const category = categoryFromSlug(categorySlug, categories);
  if (!category) notFound();

  const popular = await getPopularIdeasInCategory(ideas, category, 12);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          href="/brainstorm"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          ← All themes
        </Link>
        <h1 className="text-2xl font-bold">{category}</h1>
        <p className="text-sm text-[var(--muted)]">
          Ideas already published onchain, sorted by popularity (vault shares).
        </p>
        <Link
          href="/brainstorm#free-form"
          className="inline-block rounded-lg border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10"
        >
          Create my own idea (no card) →
        </Link>
      </header>

      {popular.length === 0 ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--muted)]">
          No ideas indexed in this category yet.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {popular.map((row) => (
            <li key={row.idea.canonicalId}>
              <PopularIdeaCard row={row} />
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-[var(--border)] pt-8">
        <p className="text-sm text-[var(--muted)]">
          Nothing matches what you want to build?
        </p>
        <Link
          href={`/brainstorm/new?category=${encodeURIComponent(category)}`}
          className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black"
        >
          Create a new idea
        </Link>
      </div>
    </div>
  );
}
