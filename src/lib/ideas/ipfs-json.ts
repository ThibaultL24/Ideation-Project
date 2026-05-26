// src/lib/ideas/ipfs-json.ts
import type { Idea, IpfsIdeaMetadata } from "./schema";
import { githubReadmePathForIdea } from "./markdown";

export function generateIpfsJson(idea: Idea, date = new Date()): IpfsIdeaMetadata {
  return {
    schemaVersion: "1.0",
    canonicalId: idea.canonicalId,
    slug: idea.slug,
    title: idea.title,
    tagline: idea.tagline,
    category: idea.category,
    description: idea.description,
    comparable: idea.comparable,
    tags: idea.tags,
    source: "build-on-intuition-300-ideas",
    githubPath: githubReadmePathForIdea(idea, date),
  };
}
