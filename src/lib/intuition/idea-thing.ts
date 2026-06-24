// src/lib/intuition/idea-thing.ts
import type { PinThingMutationVariables } from "@0xintuition/graphql";
import { buildBrainstormVariantFingerprint } from "@/lib/ideas/idea-variant";
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import type { Idea } from "@/lib/ideas/schema";

/** Stable IPFS payload for bounty 3A catalog migration (one atom per catalog idea). */
export function catalogIdeaToPinThing(idea: Idea): PinThingMutationVariables {
  return {
    name: idea.title,
    description: [
      idea.tagline,
      "",
      idea.description,
      idea.comparable ? `Comparable: ${idea.comparable}` : "",
      `Category: ${idea.category}`,
      `Canonical ID: ${idea.canonicalId}`,
    ]
      .filter(Boolean)
      .join("\n"),
    image: "",
    url: "",
  };
}

/** Dapp publish: catalog metadata + brainstorm draft / PR fingerprint (may yield a new atom). */
export function ideaToPinThing(
  idea: Idea,
  githubUrl?: string,
  draft?: Partial<BrainstormDraft> | null,
): PinThingMutationVariables {
  const draftLines = draft
    ? [
        draft.problem?.trim() ? `Problem: ${draft.problem.trim()}` : "",
        draft.solution?.trim() ? `Solution: ${draft.solution.trim()}` : "",
        draft.users?.trim() ? `Users: ${draft.users.trim()}` : "",
        draft.intuitionFit?.trim()
          ? `Intuition fit: ${draft.intuitionFit.trim()}`
          : "",
        draft.mvp?.trim() ? `MVP: ${draft.mvp.trim()}` : "",
        draft.risks?.trim() ? `Risks: ${draft.risks.trim()}` : "",
        draft.challenge?.trim() ? `Challenge: ${draft.challenge.trim()}` : "",
      ].filter(Boolean)
    : [];

  const fingerprint = buildBrainstormVariantFingerprint(idea, draft, githubUrl);

  return {
    name: idea.title,
    description: [
      idea.tagline,
      "",
      idea.description,
      idea.comparable ? `Comparable: ${idea.comparable}` : "",
      `Category: ${idea.category}`,
      `Canonical ID: ${idea.canonicalId}`,
      `Slug: ${idea.slug}`,
      `Brainstorm variant fingerprint: ${fingerprint}`,
      draftLines.length ? "" : "",
      ...draftLines,
    ]
      .filter(Boolean)
      .join("\n"),
    image: "",
    url: githubUrl?.trim() ?? "",
  };
}

export function labelToPinThing(
  name: string,
  description: string,
): PinThingMutationVariables {
  return {
    name,
    description,
    image: "",
    url: "",
  };
}
