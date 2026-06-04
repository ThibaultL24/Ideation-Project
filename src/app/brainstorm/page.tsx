// src/app/brainstorm/page.tsx
import { CategoryGrid } from "@/components/brainstorm/category-grid";
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
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
          Brainstorm · sans création d’atom
        </p>
        <h1 className="text-3xl font-bold">
          Que voulez-vous créer aujourd’hui ?
        </h1>
        <p className="max-w-2xl text-sm text-[var(--muted)]">
          Choisissez un thème pour voir les idées déjà soutenues onchain. Si rien
          ne correspond, vous pourrez décrire votre projet — nous vérifierons les
          doublons avant toute publication.
        </p>
      </header>

      <CategoryGrid categories={grid} />
    </div>
  );
}
