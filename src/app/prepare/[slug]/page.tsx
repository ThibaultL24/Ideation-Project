// src/app/prepare/[slug]/page.tsx
import { notFound } from "next/navigation";
import { PreparePageClient } from "@/components/prepare/prepare-page-client";
import { PrepareWorkspace } from "@/components/prepare/prepare-workspace";
import { isFreeIdeaSlug } from "@/lib/ideas/free-idea";
import { loadNormalizedIdeas } from "@/lib/ideas/load";

interface PreparePageProps {
  params: Promise<{ slug: string }>;
}

export default async function PreparePage({ params }: PreparePageProps) {
  const { slug } = await params;

  if (isFreeIdeaSlug(slug)) {
    return <PreparePageClient slug={slug} />;
  }

  const idea = loadNormalizedIdeas().find((item) => item.slug === slug);
  if (!idea) notFound();

  return <PrepareWorkspace idea={idea} />;
}
