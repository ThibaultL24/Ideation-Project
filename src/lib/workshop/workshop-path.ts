// src/lib/workshop/workshop-path.ts
import { deriveAtomLabel } from "./atom-label";
import type { BrainstormDirection } from "./brainstorm";
import { normalizeIdeaBrief, type IdeaBrief } from "./idea-brief";
import type { WorkshopSession } from "./session";

export type WorkshopPath = "explore" | "precise";

export function seedBriefFromDirection(
  direction: BrainstormDirection,
  explorationPrompt: string,
): IdeaBrief {
  return normalizeIdeaBrief(
    {
      title: direction.title,
      oneLiner: direction.tagline,
      problem: direction.problemHook,
      solution: direction.mvpSketch,
      targetUsers: `Primary audience for « ${direction.title} » (${direction.angle}).`,
      whyNow: direction.whyInteresting,
      intuitionAngle: direction.intuitionFit,
      trustMechanism:
        "Stake on quality claims; counter-staking for disputes; graph read by users seeking trusted signals.",
      mvpScope: direction.mvpSketch,
      openQuestions: direction.risks.map((r) => `How do we mitigate: ${r}?`),
    },
    direction.title,
    explorationPrompt,
  );
}

export function seedBriefFromPreciseIntent(session: WorkshopSession): IdeaBrief {
  const raw = session.rawIntent.trim();
  const title = deriveAtomLabel({
    title: session.catalogTitle,
    rawIntent: raw,
    fallback: "New Idea",
  });
  return normalizeIdeaBrief(
    {
      title,
      oneLiner: raw.length > 120 ? `${raw.slice(0, 117)}…` : raw,
      problem: raw,
      solution:
        "Describe the product loop in the PR README — or run brainstorm + deep research first to enrich this section.",
      targetUsers: "To be refined in the PR or via /workshop/research.",
      whyNow: "Submitted as a concrete product proposal from the ideation workshop.",
      intuitionAngle:
        "Document atoms and triples in the README; core bounty triple links the idea to Intuition Protocol.",
      trustMechanism: "To be specified in the PR.",
      mvpScope: "To be specified in the PR.",
      openQuestions: ["What is the smallest shippable loop?", "Who stakes first?"],
    },
    title,
    raw,
  );
}

export function resolveSessionBrief(session: WorkshopSession): IdeaBrief {
  if (session.ideaBrief?.problem?.trim()) {
    return normalizeIdeaBrief(
      session.ideaBrief,
      session.ideaBrief.title || session.catalogTitle || "New Idea",
      session.explorationPrompt ?? session.rawIntent,
    );
  }
  if (session.selectedDirection) {
    return seedBriefFromDirection(
      session.selectedDirection,
      session.explorationPrompt ?? session.rawIntent,
    );
  }
  if (session.path === "precise") {
    return seedBriefFromPreciseIntent(session);
  }
  return seedBriefFromPreciseIntent(session);
}

/** Session with ideaBrief filled from direction, research, or precise intent — for PR/plan APIs. */
export function normalizeSessionForPublish(session: WorkshopSession): WorkshopSession {
  const ideaBrief = resolveSessionBrief(session);
  return { ...session, ideaBrief };
}

export function canOpenPrepare(session: WorkshopSession): boolean {
  if (!session.rawIntent?.trim()) return false;
  if (session.path === "precise") return true;
  if (session.briefFinalizedAt) return true;
  if (session.selectedDirection) return true;
  if (session.ideaBrief?.problem?.trim()) return true;
  return false;
}
