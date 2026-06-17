// src/app/brainstorm/new/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrainstormNewForm } from "@/components/brainstorm/brainstorm-new-form";
import { categoryFromSlug } from "@/lib/ideas/category";
import { getCategories, loadNormalizedIdeas } from "@/lib/ideas/load";

interface BrainstormNewPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function BrainstormNewPage({
  searchParams,
}: BrainstormNewPageProps) {
  const params = await searchParams;
  const categoryParam = params.category?.trim();
  if (!categoryParam) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Create an idea</h1>
        <p className="text-[var(--muted)]">
          Pick a theme from the Brainstorm page first.
        </p>
        <Link href="/brainstorm" className="text-[var(--accent)] hover:underline">
          ← Choose a theme
        </Link>
      </div>
    );
  }

  const ideas = loadNormalizedIdeas();
  const categories = getCategories(ideas);
  const category =
    categories.find((c) => c === categoryParam) ??
    categoryFromSlug(categoryParam, categories);
  if (!category) notFound();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Describe your idea</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Duplicate check before structuring — no atom is created here.
        </p>
      </header>
      <BrainstormNewForm category={category} />
    </div>
  );
}
