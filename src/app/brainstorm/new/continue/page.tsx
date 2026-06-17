// src/app/brainstorm/new/continue/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BrainstormWorkspace } from "@/components/brainstorm/brainstorm-workspace";
import { categoryFromSlug } from "@/lib/ideas/category";
import { draftIdeaFromPrompt } from "@/lib/ideas/brainstorm-similarity";
import { getCategories, loadNormalizedIdeas } from "@/lib/ideas/load";

interface ContinuePageProps {
  searchParams: Promise<{ prompt?: string; category?: string }>;
}

export default async function BrainstormContinuePage({
  searchParams,
}: ContinuePageProps) {
  const params = await searchParams;
  const prompt = params.prompt?.trim();
  const categoryParam = params.category?.trim();
  if (!prompt || prompt.length < 3 || !categoryParam) {
    redirect("/brainstorm");
  }

  const ideas = loadNormalizedIdeas();
  const categories = getCategories(ideas);
  const category =
    categories.find((c) => c === categoryParam) ??
    categoryFromSlug(categoryParam, categories);
  if (!category) notFound();

  const idea = draftIdeaFromPrompt(prompt, category);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">
        No strong duplicate detected — structure your draft before any PR or onchain
        publication.
      </div>
      <BrainstormWorkspace idea={idea} />
      <Link href="/brainstorm" className="text-sm text-[var(--accent)] hover:underline">
        ← Back to themes
      </Link>
    </div>
  );
}
