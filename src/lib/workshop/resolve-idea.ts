// src/lib/workshop/resolve-idea.ts
import { loadNormalizedIdeas } from "@/lib/ideas/load";
import type { Idea } from "@/lib/ideas/schema";
import { deriveAtomLabel } from "./atom-label";
import type { WorkshopSession } from "./session";

function workshopTitle(session: WorkshopSession): string {
  return (
    session.ideaBrief?.title?.trim() ||
    session.selectedDirection?.title?.trim() ||
    session.tripleDraft?.ideaTitle?.trim() ||
    session.catalogTitle?.trim() ||
    deriveAtomLabel({
      title: session.catalogTitle,
      oneLiner: session.ideaBrief?.oneLiner,
      rawIntent: session.rawIntent,
      fallback: "Workshop Idea",
    })
  );
}

function workshopTagline(session: WorkshopSession): string {
  return (
    session.ideaBrief?.oneLiner?.trim() ||
    session.selectedDirection?.tagline?.trim() ||
    session.tripleDraft?.refinedPitch?.trim().slice(0, 160) ||
    session.rawIntent.trim().slice(0, 160) ||
    "Workshop proposal"
  );
}

export function resolveIdeaFromSession(session: WorkshopSession): Idea {
  const title = workshopTitle(session);
  const tagline = workshopTagline(session);
  const description =
    session.ideaBrief?.solution?.trim() ||
    session.tripleDraft?.refinedPitch?.trim() ||
    session.ideaBrief?.problem?.trim() ||
    session.rawIntent;

  if (session.catalogSlug) {
    const found = loadNormalizedIdeas().find((i) => i.slug === session.catalogSlug);
    if (found) {
      return {
        ...found,
        title,
        tagline,
        description: description || found.description,
      };
    }
  }

  return {
    canonicalId: session.catalogCanonicalId ?? `workshop-${session.id}`,
    slug: session.catalogSlug ?? `workshop-${session.id}`,
    title,
    tagline,
    category: "Workshop",
    categoryIndex: 1,
    ideaIndex: 1,
    description,
    tags: ["workshop", "ideation"],
    status: "draft",
  };
}
