// src/app/brainstorm/idea/[slug]/page.tsx
import { notFound } from "next/navigation";
import { BrainstormWorkspace } from "@/components/brainstorm/brainstorm-workspace";
import { loadNormalizedIdeas } from "@/lib/ideas/load";

interface BrainstormIdeaPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BrainstormIdeaPage({
  params,
}: BrainstormIdeaPageProps) {
  const { slug } = await params;
  const idea = loadNormalizedIdeas().find((item) => item.slug === slug);
  if (!idea) notFound();

  return <BrainstormWorkspace idea={idea} />;
}
