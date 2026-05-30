// src/app/workshop/from/[slug]/page.tsx
import { notFound } from "next/navigation";
import { IntentForm } from "@/components/workshop/intent-form";
import { loadNormalizedIdeas } from "@/lib/ideas/load";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkshopFromCatalogPage({ params }: PageProps) {
  const { slug } = await params;
  const idea = loadNormalizedIdeas().find((i) => i.slug === slug);
  if (!idea) notFound();

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-xs text-[var(--accent)]">{idea.category}</p>
        <h1 className="text-2xl font-bold">{idea.title}</h1>
        <p className="text-sm text-[var(--muted)]">{idea.tagline}</p>
      </section>
      <IntentForm
        catalogSlug={idea.slug}
        catalogCanonicalId={idea.canonicalId}
        catalogTitle={idea.title}
        catalogDescription={idea.description}
      />
    </div>
  );
}
