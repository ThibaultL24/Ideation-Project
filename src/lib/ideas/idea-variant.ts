// src/lib/ideas/idea-variant.ts
import type { BrainstormDraft } from "./publish-plan";
import type { Idea } from "./schema";

/** Stable fingerprint — same draft + PR URL → same on-chain atom id (idempotent re-publish). */
export function buildBrainstormVariantFingerprint(
  idea: Idea,
  draft?: Partial<BrainstormDraft> | null,
  githubUrl?: string,
): string {
  const payload = {
    slug: idea.slug,
    canonicalId: idea.canonicalId,
    githubUrl: githubUrl?.trim() ?? "",
    problem: draft?.problem?.trim() ?? "",
    solution: draft?.solution?.trim() ?? "",
    users: draft?.users?.trim() ?? "",
    intuitionFit: draft?.intuitionFit?.trim() ?? "",
    mvp: draft?.mvp?.trim() ?? "",
    risks: draft?.risks?.trim() ?? "",
    challenge: draft?.challenge?.trim() ?? "",
    supportTriples: draft?.supportTriples?.trim() ?? "",
    archetype: draft?.archetype ?? "",
  };
  return JSON.stringify(payload);
}
