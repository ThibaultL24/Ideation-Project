// src/lib/intuition/idea-thing.ts
import type { PinThingMutationVariables } from "@0xintuition/graphql";
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import type { Idea } from "@/lib/ideas/schema";

export function ideaToPinThing(
  idea: Idea,
  githubBlobUrl?: string,
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
      ].filter(Boolean)
    : [];

  return {
    name: idea.title,
    description: [
      idea.tagline,
      "",
      idea.description,
      idea.comparable ? `Comparable: ${idea.comparable}` : "",
      `Category: ${idea.category}`,
      `Canonical ID: ${idea.canonicalId}`,
      draftLines.length ? "" : "",
      ...draftLines,
    ]
      .filter(Boolean)
      .join("\n"),
    image: "",
    url: githubBlobUrl ?? "",
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
