// src/lib/assist/idea-research-input.ts
import type { CatalogMatch } from "@/lib/workshop/discover-similar";
import type { GithubIssueHit } from "@/lib/workshop/github-discover";
import type { BrainstormDirection } from "@/lib/workshop/brainstorm";
import type { WorkshopGraphContext } from "@/lib/workshop/graph-context-types";

export interface GenerateIdeaResearchInput {
  prompt: string;
  ideaTitle: string;
  catalogDescription?: string;
  graphContext?: WorkshopGraphContext | null;
  catalogMatches: CatalogMatch[];
  githubIssues: GithubIssueHit[];
  overlapMessage?: string;
  explorationPrompt?: string;
  selectedDirection?: BrainstormDirection;
}
