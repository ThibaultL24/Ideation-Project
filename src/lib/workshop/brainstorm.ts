// src/lib/workshop/brainstorm.ts

export interface BrainstormDirection {
  id: string;
  title: string;
  tagline: string;
  angle: string;
  problemHook: string;
  intuitionFit: string;
  mvpSketch: string;
  whyInteresting: string;
  risks: string[];
}

export interface BrainstormReport {
  territory: string;
  clarifyingQuestions: string[];
  directions: BrainstormDirection[];
  recommendedDirectionId?: string;
  generatedAt: string;
}

export function directionToRefinedIntent(
  explorationPrompt: string,
  direction: BrainstormDirection,
): string {
  return [
    explorationPrompt.trim(),
    "",
    "--- Selected brainstorm direction ---",
    `Product: ${direction.title}`,
    `Tagline: ${direction.tagline}`,
    `Angle: ${direction.angle}`,
    `Problem: ${direction.problemHook}`,
    `Why Intuition: ${direction.intuitionFit}`,
    `MVP sketch: ${direction.mvpSketch}`,
    `Why interesting: ${direction.whyInteresting}`,
  ].join("\n");
}
