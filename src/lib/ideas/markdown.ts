// src/lib/ideas/markdown.ts
import type { Idea } from "./schema";
import { githubIdeaFolderPath } from "./slug";

export function githubReadmePathForIdea(idea: Idea, date = new Date()): string {
  return `${githubIdeaFolderPath(idea.slug, date)}/README.md`;
}

export function generateIdeaMarkdown(idea: Idea, _date = new Date()): string {
  const comparable = idea.comparable
    ? `\n\n**Comparable:** ${idea.comparable}`
    : "";
  return `---
title: ${idea.title}
category: ${idea.category}
canonicalId: ${idea.canonicalId}
author: Ideation
---

# ${idea.title}

${idea.description}${comparable}
`;
}
