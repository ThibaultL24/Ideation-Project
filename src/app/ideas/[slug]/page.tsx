// src/app/ideas/[slug]/page.tsx
import { IdeaDetailView } from "@/components/ideas/idea-detail-view";
import { loadCatalogIdeaBySlug } from "@/lib/ideas/load-catalog";
import { buildIdeaFullState } from "@/lib/ideas/idea-state";

interface IdeaDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function IdeaDetailPage({ params }: IdeaDetailPageProps) {
  const { slug } = await params;
  const idea = (await loadCatalogIdeaBySlug(slug)) ?? null;
  const state = idea
    ? await buildIdeaFullState(idea, { verifyOnchain: true })
    : null;

  return (
    <IdeaDetailView
      slug={slug}
      idea={idea}
      onchainAtomId={state?.onchain?.atomId}
      atomInIndexer={state?.onchain?.atomInIndexer}
      coreTriplePresent={state?.onchain?.coreTriplePresent}
    />
  );
}
