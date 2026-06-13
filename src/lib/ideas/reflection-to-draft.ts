// src/lib/ideas/reflection-to-draft.ts
import type { IdeaReflectionReport } from "./idea-reflection";
import type { BrainstormDraft } from "./publish-plan";

export function reflectionToBrainstormDraft(
  report: IdeaReflectionReport,
): BrainstormDraft {
  return {
    archetype: report.archetype,
    problem: report.problem,
    solution: report.solution,
    users: report.users,
    intuitionFit: report.intuitionFit,
    mvp: report.mvp,
    risks: report.risks.join("\n"),
    challenge: report.challenge,
    supportTriples: "",
  };
}
