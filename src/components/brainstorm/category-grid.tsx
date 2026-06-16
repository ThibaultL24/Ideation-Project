// src/components/brainstorm/category-grid.tsx
import Link from "next/link";
import { categoryToSlug } from "@/lib/ideas/category";

interface CategoryGridProps {
  categories: Array<{ name: string; count: number }>;
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map(({ name, count }) => (
        <li key={name}>
          <Link
            href={`/brainstorm/category/${categoryToSlug(name)}`}
            className="flex h-full min-h-[120px] flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--accent)]"
          >
            <h2 className="font-semibold leading-snug">{name}</h2>
            <p className="mt-auto pt-3 text-xs text-[var(--muted)]">
              {count} idée{count > 1 ? "s" : ""} au catalogue
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
