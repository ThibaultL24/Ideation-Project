// src/app/brainstorm/page.tsx
import { CategoryGrid } from "@/components/brainstorm/category-grid";
import { IdeationFlow } from "@/components/brainstorm/ideation-flow";
import { getCategoryCounts } from "@/lib/ideas/category";
import { getCategories, loadNormalizedIdeas } from "@/lib/ideas/load";

export default function BrainstormIndexPage() {
  const ideas = loadNormalizedIdeas();
  const categories = getCategories(ideas);
  const counts = getCategoryCounts(ideas);
  const grid = categories.map((name) => ({
    name,
    count: counts.get(name) ?? 0,
  }));

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
            Brainstorm · free-form
          </p>
          <h1 className="text-3xl font-bold">Describe your hunch</h1>
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            5-step AI journey: similarities, questions, synthesis, challenge — then
            GitHub publication and onchain attestation.
          </p>
        </header>
        <IdeationFlow />
      </section>

      <section className="space-y-6 border-t border-[var(--border)] pt-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
            Catalog · by theme
          </p>
          <h2 className="text-2xl font-bold">
            What do you want to build today?
          </h2>
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            Pick a theme to see ideas already supported onchain. If nothing fits,
            describe your project — we will check for duplicates before any
            publication.
          </p>
        </header>
        <CategoryGrid categories={grid} />
      </section>
    </div>
  );
}
