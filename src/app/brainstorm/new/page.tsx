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
          You do not need to pick a theme first — describe your project in the
          free-form brainstorm flow.
        </p>
        <Link
          href="/brainstorm#free-form"
          className="inline-block neon-btn rounded-lg px-5 py-2.5 text-sm font-medium"
        >
          Start without a card →
        </Link>
        <p className="text-sm text-[var(--muted)]">
          Or{" "}
          <Link href="/brainstorm" className="text-[var(--accent)] hover:underline">
            browse themes
          </Link>{" "}
          to explore existing catalog ideas.
        </p>
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
