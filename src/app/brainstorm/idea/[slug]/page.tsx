// src/app/brainstorm/idea/[slug]/page.tsx
import { BrainstormIdeaPageClient } from "@/components/brainstorm/brainstorm-idea-page-client";
import { loadNormalizedIdeas } from "@/lib/ideas/load";

interface BrainstormIdeaPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BrainstormIdeaPage({
  params,
}: BrainstormIdeaPageProps) {
  const { slug } = await params;
  const catalogIdea = loadNormalizedIdeas().find((item) => item.slug === slug) ?? null;

  return <BrainstormIdeaPageClient slug={slug} catalogIdea={catalogIdea} />;
}
