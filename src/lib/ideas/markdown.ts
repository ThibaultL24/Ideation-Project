// src/lib/ideas/markdown.ts
import type { Idea } from "./schema";
import { githubIdeaFolderPath } from "./slug";

export function generateIdeaMarkdown(idea: Idea, date = new Date()): string {
  const folder = githubIdeaFolderPath(idea.slug, date);
  const isoDate = date.toISOString().slice(0, 10);
  const tagsYaml = idea.tags.map((tag) => `  - ${tag}`).join("\n");
  const comparable = idea.comparable
    ? `\ncomparable: "${idea.comparable.replace(/"/g, '\\"')}"`
    : "";

  return `---
title: "${idea.title}"
tagline: "${idea.tagline.replace(/"/g, '\\"')}"
author: "Ideation"
date: "${isoDate}"
status: draft
canonical_id: "${idea.canonicalId}"
category: "${idea.category.replace(/"/g, '\\"')}"
tags:
${tagsYaml}${comparable}
intuition_atoms: []
github_discussion: ""
---

# ${idea.title}

> ${idea.tagline}

## Problem

Builders need verifiable, stake-weighted ways to discover and validate ${idea.category.toLowerCase()} concepts on Intuition.

## Solution

${idea.description}

## How It Uses Intuition

- **Atoms** for the product concept and key entities
- **Triples** linking the idea to Intuition and category claims
- **Vaults** for community conviction on quality and feasibility
- **Counter-staking** to challenge weak or misleading claims

## Comparable

${idea.comparable ? idea.comparable : "_Novel concept — no direct Web2/Web3 comparable listed._"}

## Metadata

- Canonical ID: \`${idea.canonicalId}\`
- Category: ${idea.category}
- Suggested GitHub path: \`${folder}/README.md\`
`;
}

export function githubReadmePathForIdea(idea: Idea, date = new Date()): string {
  return `${githubIdeaFolderPath(idea.slug, date)}/README.md`;
}
