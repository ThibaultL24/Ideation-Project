import { draftIdeaFromPrompt } from "./brainstorm-similarity";
import { loadNormalizedIdeas } from "./load";
import { ideaSchema, type Idea } from "./schema";

function parseIdeaPayload(raw: unknown): Idea | null {
  if (!raw || typeof raw !== "object") return null;

  const strict = ideaSchema.safeParse(raw);
  if (strict.success) return strict.data;

  const record = raw as Record<string, unknown>;
  const coerced = {
    ...record,
    categoryIndex:
      typeof record.categoryIndex === "number" && record.categoryIndex > 0
        ? record.categoryIndex
        : 1,
    ideaIndex:
      typeof record.ideaIndex === "number" && record.ideaIndex > 0
        ? record.ideaIndex
        : 1,
  };
  const retry = ideaSchema.safeParse(coerced);
  return retry.success ? retry.data : null;
}

export function resolvePublishIdea(input: {
  slug?: string;
  idea?: unknown;
  prompt?: string;
  category?: string;
}): Idea | null {
  const fromPayload = parseIdeaPayload(input.idea);
  if (fromPayload) return fromPayload;

  const slug = input.slug?.trim();
  if (!slug) return null;

  const catalog = loadNormalizedIdeas().find((item) => item.slug === slug);
  if (catalog) return catalog;

  const prompt = input.prompt?.trim();
  const category = input.category?.trim();
  if (slug.startsWith("draft-") && prompt && category) {
    const draft = draftIdeaFromPrompt(prompt, category);
    return { ...draft, slug, canonicalId: slug };
  }

  return null;
}
