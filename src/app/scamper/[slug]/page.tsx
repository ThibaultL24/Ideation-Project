// src/app/scamper/[slug]/page.tsx
import { notFound } from "next/navigation";
import { ScamperWorkspace } from "@/components/scamper/scamper-workspace";
import { loadNormalizedIdeas } from "@/lib/ideas/load";

interface ScamperPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ScamperPage({ params }: ScamperPageProps) {
  const { slug } = await params;
  const idea = loadNormalizedIdeas().find((item) => item.slug === slug);
  if (!idea) notFound();

  return (
    <ScamperWorkspace
      workItem={{
        slug: idea.slug,
        title: idea.title,
        tagline: idea.tagline,
        description: idea.description,
        mode: "catalog",
      }}
    />
  );
}
