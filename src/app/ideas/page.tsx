// src/app/ideas/page.tsx
import Link from "next/link";
import {
  getCatalogCategories,
  loadCatalogIdeas,
} from "@/lib/ideas/load-catalog";
import { getNetworkLabel } from "@/lib/intuition/config";

interface IdeasPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function IdeasPage({ searchParams }: IdeasPageProps) {
  const params = await searchParams;
  const catalog = await loadCatalogIdeas();
  const ideas = catalog.ideas;
  const categories = await getCatalogCategories();
  const filtered = params.category
    ? ideas.filter((idea) => idea.category === params.category)
    : ideas;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catalog</h1>
        <p className="text-sm text-[var(--muted)]">
          {filtered.length} project{filtered.length !== 1 ? "s" : ""}
          {params.category ? ` · ${params.category}` : ""}
          {catalog.source === "graph"
            ? ` · on-chain list (${getNetworkLabel(catalog.network)})`
            : " · local snapshot (graph empty — migrate or switch network)"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/ideas"
          className={`rounded-full border px-3 py-1 text-xs ${
            !params.category
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-[var(--border)] text-[var(--muted)]"
          }`}
        >
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category}
            href={`/ideas?category=${encodeURIComponent(category)}`}
            className={`rounded-full border px-3 py-1 text-xs ${
              params.category === category
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted)]"
            }`}
          >
            {category}
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
              <h2 className="font-semibold">{idea.title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">
                {idea.description}
              </p>
              <p className="mt-2 text-xs text-[var(--accent)]">
                {idea.category}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
