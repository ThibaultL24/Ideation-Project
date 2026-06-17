// src/lib/assist/fallback-idea-reflection.ts
import type { Idea } from "@/lib/ideas/schema";
import type { IdeaReflectionReport } from "@/lib/ideas/idea-reflection";
import type { BrainstormArchetype } from "@/lib/ideas/publish-plan";

function inferArchetype(category: string): BrainstormArchetype {
  const lower = category.toLowerCase();
  if (lower.includes("ai") || lower.includes("agent")) return "agent-memory";
  if (lower.includes("review") || lower.includes("reputation")) return "reputation";
  if (lower.includes("social") || lower.includes("community")) return "social-attestation";
  if (lower.includes("security") || lower.includes("safety")) return "risk-detection";
  if (lower.includes("predict") || lower.includes("signal") || lower.includes("finance"))
    return "prediction-signal";
  if (lower.includes("market") || lower.includes("discover")) return "curated-list";
  return "reputation";
}

export function buildFallbackIdeaReflection(
  idea: Idea,
  overlapMessage?: string,
  userAngle?: string,
): IdeaReflectionReport {
  const archetype = inferArchetype(idea.category);
  const angle = userAngle?.trim();

  return {
    headline: angle ? `${idea.title} — ${angle}` : idea.title,
    reflection: [
      `${idea.title} starts from the Intuition catalog as a concrete lead: ${idea.tagline}`,
      idea.description.slice(0, 400),
      angle ? `Personal angle: ${angle}` : "",
      "The reflection turns this entry into a verifiable product proposal: real problem, specific users, MVP loop, and Intuition claims (atoms/triples) that carry trust.",
    ]
      .filter(Boolean)
      .join(" "),
    strengths: [
      `Proposal already structured in the catalog (${idea.category}).`,
      `Clear tagline: ${idea.tagline}`,
      "Bounty core triple ready: [Idea] - [top project ideas for] - [Intuition].",
    ],
    weaknesses: [
      "The catalog entry stays generic — specify the first user and first workflow.",
      "Intuition fit must name explicitly which claims are staked and by whom.",
      "Duplicate risk if a similar idea already exists on-chain or on GitHub.",
    ],
    problem: idea.description.slice(0, 500) || idea.tagline,
    solution: `${idea.title}: ${idea.tagline}. ${angle ?? "To be specified in the draft."}`,
    users:
      "Builders and Intuition community members testing product ideas before GitHub + on-chain publication.",
    intuitionFit: `Create or reuse the atom « ${idea.title} » and the triple [${idea.title}] - [top project ideas for] - [Intuition]. Signal (staking) can then qualify the quality of the proposal.`,
    mvp:
      "Idea screen → state check → refined draft → PR intuition-box/ideas → publish on-chain.",
    risks: [
      "Cold start if nobody stakes on the proposal.",
      "Graph fragmentation if support predicates are published too early.",
      "Crypto UX if staking is required before product value.",
    ],
    challenge:
      "Prove that a non-technical user understands why this idea deserves to be scoped and supported on Intuition.",
    archetype,
    ecosystemNote:
      overlapMessage?.trim() ||
      "Check the graph and intuition-box/ideas before publishing new atoms.",
    generatedAt: new Date().toISOString(),
  };
}
