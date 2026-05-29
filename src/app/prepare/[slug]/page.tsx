// src/app/prepare/[slug]/page.tsx
import { notFound } from "next/navigation";
import { PrepareWorkspace } from "@/components/prepare/prepare-workspace";
import { loadNormalizedIdeas } from "@/lib/ideas/load";

interface PreparePageProps {
  params: Promise<{ slug: string }>;
}

export default async function PreparePage({ params }: PreparePageProps) {
  const { slug } = await params;
  const idea = loadNormalizedIdeas().find((item) => item.slug === slug);
  if (!idea) notFound();

  return <PrepareWorkspace idea={idea} />;
}
