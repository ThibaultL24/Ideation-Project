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
            Brainstorm · idée libre
          </p>
          <h1 className="text-3xl font-bold">Décrivez votre hunch</h1>
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            Parcours IA en 5 étapes : similarités, questions, synthèse, challenge
            — puis publication GitHub et attestation onchain.
          </p>
        </header>
        <IdeationFlow />
      </section>

      <section className="space-y-6 border-t border-[var(--border)] pt-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
            Catalogue · par thème
          </p>
          <h2 className="text-2xl font-bold">
            Que voulez-vous créer aujourd&apos;hui ?
          </h2>
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            Choisissez un thème pour voir les idées déjà soutenues onchain. Si rien
            ne correspond, décrivez votre projet — nous vérifierons les doublons
            avant toute publication.
          </p>
        </header>
        <CategoryGrid categories={grid} />
      </section>
    </div>
  );
}
