// src/lib/workshop/idea-research.ts
import type { IdeaBrief } from "./idea-brief";

export interface SimilarIdeaHit {
  title: string;
  source: "catalog" | "github" | "graph";
  reason: string;
  url?: string;
  slug?: string;
  tagline?: string;
}

export interface IdeaDiagnostic {
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

export interface ImprovementSuggestion {
  framework: string;
  suggestion: string;
}

export interface RelatedIdeaPitch {
  title: string;
  pitch: string;
  angle: string;
}

/** Deep research report — 5 fixed sections. */
export interface DeepResearchReport {
  headline: string;
  similarIdeas: SimilarIdeaHit[];
  diagnostic: IdeaDiagnostic;
  improvements: ImprovementSuggestion[];
  relatedIdeas: RelatedIdeaPitch[];
  proposedBrief: IdeaBrief;
  generatedAt: string;
}

export const RESEARCH_SECTIONS = [
  { id: 1, title: "Similar ideas", key: "similarIdeas" as const },
  { id: 2, title: "Diagnostic", key: "diagnostic" as const },
  { id: 3, title: "Improvement ideas", key: "improvements" as const },
  { id: 4, title: "Related concepts", key: "relatedIdeas" as const },
  { id: 5, title: "Proposed idea brief", key: "proposedBrief" as const },
];
