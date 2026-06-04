// src/app/brainstorm/category/[categorySlug]/[ideaSlug]/page.tsx
import { notFound } from "next/navigation";
import { AtomDetailPanel } from "@/components/brainstorm/atom-detail-panel";
import { categoryFromSlug } from "@/lib/ideas/category";
import { verifyIdeaOnchain } from "@/lib/ideas/idea-state";
import { getCategories, loadNormalizedIdeas } from "@/lib/ideas/load";

interface AtomDetailPageProps {
  params: Promise<{ categorySlug: string; ideaSlug: string }>;
}

export default async function BrainstormAtomDetailPage({
  params,
}: AtomDetailPageProps) {
  const { categorySlug, ideaSlug } = await params;
  const ideas = loadNormalizedIdeas();
  const categories = getCategories(ideas);
  const category = categoryFromSlug(categorySlug, categories);
  if (!category) notFound();

  const idea = ideas.find(
    (item) => item.slug === ideaSlug && item.category === category,
  );
  if (!idea) notFound();

  const onchain = await verifyIdeaOnchain(idea);

  return (
    <AtomDetailPanel
      idea={idea}
      onchain={onchain}
      categorySlug={categorySlug}
    />
  );
}
