// src/lib/workshop/resolve-idea.ts
import { loadNormalizedIdeas } from "@/lib/ideas/load";
import type { Idea } from "@/lib/ideas/schema";
import type { WorkshopSession } from "./session";

export function resolveIdeaFromSession(session: WorkshopSession): Idea {
  if (session.catalogSlug) {
    const found = loadNormalizedIdeas().find((i) => i.slug === session.catalogSlug);
    if (found) return found;
  }

  const title =
    session.catalogTitle?.trim() ||
    session.tripleDraft?.ideaTitle?.trim() ||
    session.rawIntent.trim().slice(0, 80) ||
    "Workshop Idea";

  return {
    canonicalId: session.catalogCanonicalId ?? `workshop-${session.id}`,
    slug: session.catalogSlug ?? `workshop-${session.id}`,
    title,
    tagline:
      session.tripleDraft?.refinedPitch?.trim().slice(0, 160) ||
      session.rawIntent.trim().slice(0, 160),
    category: "Workshop",
    categoryIndex: 1,
    ideaIndex: 1,
    description:
      session.ideaBrief?.solution?.trim() ||
      session.tripleDraft?.refinedPitch?.trim() ||
      session.rawIntent,
    tags: ["workshop", "ideation"],
    status: "draft",
  };
}
