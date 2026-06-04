import { loadNormalizedIdeas } from "./load";
import { ideaSchema, type Idea } from "./schema";

export function resolvePublishIdea(input: {
  slug?: string;
  idea?: unknown;
}): Idea | null {
  if (input.idea && typeof input.idea === "object") {
    const parsed = ideaSchema.safeParse(input.idea);
    if (parsed.success) return parsed.data;
  }
  const slug = input.slug?.trim();
  if (!slug) return null;
  return loadNormalizedIdeas().find((item) => item.slug === slug) ?? null;
}
