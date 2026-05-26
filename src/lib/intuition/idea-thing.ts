// src/lib/intuition/idea-thing.ts
import type { PinThingMutationVariables } from "@0xintuition/graphql";
import type { Idea } from "@/lib/ideas/schema";

export function ideaToPinThing(
  idea: Idea,
  githubBlobUrl?: string,
): PinThingMutationVariables {
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
