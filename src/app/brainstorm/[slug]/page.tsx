// src/app/brainstorm/[slug]/page.tsx
import { notFound } from "next/navigation";
import { BrainstormWorkspace } from "@/components/brainstorm/brainstorm-workspace";
import { loadNormalizedIdeas } from "@/lib/ideas/load";

interface BrainstormPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BrainstormPage({ params }: BrainstormPageProps) {
  const { slug } = await params;
  const idea = loadNormalizedIdeas().find((item) => item.slug === slug);
  if (!idea) notFound();

  return <BrainstormWorkspace idea={idea} />;
}
