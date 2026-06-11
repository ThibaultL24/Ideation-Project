// src/lib/ideas/direction-to-draft.ts
import type { BrainstormDirection } from "@/lib/workshop/brainstorm";
import type { BrainstormArchetype, BrainstormDraft } from "./publish-plan";

const ANGLE_TO_ARCHETYPE: Record<string, BrainstormArchetype> = {
  curation: "curated-list",
  curated: "curated-list",
  list: "curated-list",
  reputation: "reputation",
  trust: "reputation",
  social: "social-attestation",
  attestation: "social-attestation",
  risk: "risk-detection",
  fraud: "risk-detection",
  prediction: "prediction-signal",
  market: "prediction-signal",
  signal: "prediction-signal",
  agent: "agent-memory",
  memory: "agent-memory",
  data: "agent-memory",
};

function inferArchetype(angle: string): BrainstormArchetype {
  const lower = angle.toLowerCase();
  for (const [key, value] of Object.entries(ANGLE_TO_ARCHETYPE)) {
    if (lower.includes(key)) return value;
  }
  return "reputation";
}

export function directionToBrainstormDraft(
  direction: BrainstormDirection,
  seedDescription?: string,
): BrainstormDraft {
  return {
    archetype: inferArchetype(direction.angle),
    problem: direction.problemHook,
    solution: `${direction.title} — ${direction.tagline}`,
    users:
      "Early adopters in the Intuition ecosystem who need clearer trust signals and discoverability.",
    intuitionFit: direction.intuitionFit,
    mvp: direction.mvpSketch,
    risks: direction.risks.join("\n"),
    challenge: direction.whyInteresting,
    supportTriples: "",
  };
}

export function mergeDraftWithSeed(
  draft: BrainstormDraft,
  seedDescription: string,
): BrainstormDraft {
  if (draft.problem.trim().length >= 30) return draft;
  return {
    ...draft,
    problem: seedDescription.slice(0, 500) || draft.problem,
  };
}
