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
        <h1 className="text-2xl font-bold">Créer une idée</h1>
        <p className="text-[var(--muted)]">
          Choisissez d’abord un thème depuis la page Brainstorm.
        </p>
        <Link href="/brainstorm" className="text-[var(--accent)] hover:underline">
          ← Choisir un thème
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
        <h1 className="text-2xl font-bold">Décrire votre idée</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Vérification anti-doublon avant structuration — aucun atom créé ici.
        </p>
      </header>
      <BrainstormNewForm category={category} />
    </div>
  );
}
