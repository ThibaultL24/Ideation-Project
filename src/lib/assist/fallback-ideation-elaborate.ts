// src/lib/assist/fallback-ideation-elaborate.ts
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import type { Idea } from "@/lib/ideas/schema";
import type {
  IdeationActionId,
  IdeationActionResult,
} from "@/lib/ideas/ideation-actions";
import { createResultId, getIdeationAction } from "@/lib/ideas/ideation-actions";

function baseResult(params: {
  action: IdeationActionId;
  idea: Idea;
  ideaVersion: number;
  title: string;
  summary: string;
  sections: IdeationActionResult["sections"];
  suggestions: IdeationActionResult["suggestions"];
}): IdeationActionResult {
  return {
    id: createResultId(),
    ideaId: params.idea.slug,
    ideaVersion: params.ideaVersion,
    action: params.action,
    title: params.title,
    summary: params.summary,
    sections: params.sections,
    suggestions: params.suggestions,
    status: "generated",
    createdAt: new Date().toISOString(),
    source: "fallback",
  };
}

export function buildFallbackIdeationElaborate(params: {
  action: IdeationActionId;
  idea: Idea;
  draft: BrainstormDraft;
  ideaVersion: number;
  intent?: string;
}): IdeationActionResult {
  const { action, idea, draft, ideaVersion } = params;
  const def = getIdeationAction(action);
  const intent = params.intent?.trim() || idea.tagline || idea.description;

  switch (action) {
    case "clarify":
      return baseResult({
        action,
        idea,
        ideaVersion,
        title: def.label,
        summary:
          "Deterministic clarification scaffold — confirm what you meant before publishing.",
        sections: [
          {
            id: "stated",
            title: "What you stated",
            content: intent.slice(0, 500),
          },
          {
            id: "sharpen",
            title: "What to sharpen",
            content:
              "Name the concrete pain, who feels it weekly, and what they do today without Intuition. Separate facts you know from assumptions still open.",
          },
          {
            id: "confirm",
            title: "Still to confirm",
            content:
              "Is the buyer the same as the end user? What success looks like in 30 days? What must stay true for Intuition to matter?",
          },
        ],
        suggestions: [
          {
            targetField: "problem",
            proposedValue:
              draft.problem.trim() ||
              `${idea.title} helps people who struggle with: ${intent.slice(0, 180)}. Today they cope with ad-hoc tools and no shared trust signal.`,
            reason: "Fill or tighten the problem statement",
          },
          {
            targetField: "solution",
            proposedValue:
              draft.solution.trim() ||
              `${idea.title} lets users attest and discover trustworthy claims related to this problem, then act on ranked signal from the graph.`,
            reason: "One-sentence product promise",
          },
          {
            targetField: "users",
            proposedValue:
              draft.users.trim() ||
              "First 100 users: a specific community that already debates this topic weekly (not “everyone”).",
            reason: "Make the first audience concrete",
          },
        ],
      });

    case "intuition-fit":
      return baseResult({
        action,
        idea,
        ideaVersion,
        title: def.label,
        summary: "Checklist fit for Intuition — no invented term IDs or on-chain claims.",
        sections: [
          {
            id: "why",
            title: "Why Intuition may help",
            content:
              "Shared attestations, stakeable signal, and discoverable graph relations beat private databases when strangers must trust claims.",
          },
          {
            id: "without",
            title: "What works without Intuition",
            content:
              "If a simple Web2 list or review site is enough, Intuition is optional — say so honestly before publishing.",
          },
          {
            id: "atoms",
            title: "Possible atoms & relations (suggestions only)",
            content: `Idea atom: "${idea.title}". Predicate candidates: reviews, recommends, risks, used by. Object candidates: Intuition, a pilot community, or a concrete claim type. Do not invent term IDs.`,
          },
          {
            id: "fake-fit",
            title: "Fake-fit risks",
            content:
              "Avoid bolting staking onto a product that never needs shared trust. Prefer reading existing graph signal before asking users to stake.",
          },
        ],
        suggestions: [
          {
            targetField: "intuitionFit",
            proposedValue:
              draft.intuitionFit.trim() ||
              `${idea.title} needs Intuition because claims must be public, comparable, and optionally stake-weighted — not locked in a private DB. Without the graph, discovery and conviction across strangers collapse.`,
            reason: "Make the Intuition case explicit",
          },
          {
            targetField: "supportTriples",
            proposedValue:
              draft.supportTriples.trim() ||
              `${idea.title} -> targets -> early adopters\n${idea.title} -> uses signal from -> Intuition`,
            reason: "Suggested support triples (not published yet)",
          },
        ],
      });

    case "mvp":
      return baseResult({
        action,
        idea,
        ideaVersion,
        title: def.label,
        summary: "Minimal path to test the core hypothesis — keep scope small.",
        sections: [
          {
            id: "users",
            title: "First users",
            content:
              draft.users.trim() ||
              "One pilot community with a weekly ritual around this problem.",
          },
          {
            id: "journey",
            title: "Primary journey",
            content:
              "1) Arrive with a claim or need → 2) See related attestations → 3) Add or stake on one claim → 4) Leave with a ranked recommendation.",
          },
          {
            id: "in-scope",
            title: "In scope",
            content:
              "One claim type, one list or feed, connect wallet optional for read, required only for attest/stake.",
          },
          {
            id: "out",
            title: "Out of scope",
            content:
              "Full reputation markets, mobile apps, multi-chain expansion, admin consoles, and generic project management.",
          },
          {
            id: "hypothesis",
            title: "Hypothesis & validation",
            content:
              "Hypothesis: users return because graph signal beats their current workaround. Validate with 10 scripted interviews + one clickable prototype.",
          },
        ],
        suggestions: [
          {
            targetField: "mvp",
            proposedValue:
              draft.mvp.trim() ||
              "Hackathon MVP: (1) landing with problem, (2) feed of 20 seeded claims, (3) attest/stake on one claim type, (4) ranked result view. No admin, no multi-chain.",
            reason: "Keep the first ship tiny",
          },
        ],
      });

    case "plan":
      return baseResult({
        action,
        idea,
        ideaVersion,
        title: def.label,
        summary:
          "Elaboration plan toward a first publishable proposal — not a ticket system.",
        sections: [
          {
            id: "steps",
            title: "Initial plan",
            content: [
              "1. Framing — lock problem, users, and non-goals.",
              "2. Problem validation — 5–10 conversations in the pilot community.",
              "3. Prototype — one happy path UI (can be clickable).",
              "4. Intuition integration — decide read vs write; draft support triples.",
              "5. User test — watch someone complete the happy path.",
              "6. Proposal prep — fill draft fields + semantic linter.",
              "7. GitHub publication — PR to intuition-box/ideas.",
              "8. On-chain publication — atom + core triple when ready.",
              "9. Iterate — one learning loop after first signal.",
            ].join("\n"),
          },
          {
            id: "boundary",
            title: "Boundary",
            content:
              "This plan helps you publish a credible Intuition proposal. It does not create GitHub issues or project boards.",
          },
        ],
        suggestions: [],
      });

    case "challenge":
      return baseResult({
        action,
        idea,
        ideaVersion,
        title: def.label,
        summary: "Honest stress-test of the current draft.",
        sections: [
          {
            id: "objection",
            title: "Main objection",
            content: `"${idea.title}" may work as a normal app without shared trust. Prove why staking or graph discovery changes outcomes.`,
          },
          {
            id: "assumptions",
            title: "Critical assumptions",
            content:
              "Early users will attest without payoff; cold start is solvable; Intuition UX is acceptable for the pilot audience.",
          },
          {
            id: "risks",
            title: "Weaknesses & risks",
            content:
              draft.risks.trim() ||
              "Overlap with catalog ideas, empty graph, and crypto friction for non-crypto users.",
          },
          {
            id: "questions",
            title: "Open questions",
            content:
              "What is the first stakeable claim? Who pays gas? What does empty-state value look like?",
          },
          {
            id: "counter",
            title: "Counter-direction",
            content:
              "Start read-only on existing graph signal; add write/stake only after retention is proven.",
          },
          {
            id: "verdict",
            title: "Verdict",
            content:
              "Promising if the Intuition case is specific. Tighten fit and MVP before publishing. (Fallback critique — enable OpenAI for a deeper pass.)",
          },
        ],
        suggestions: [
          {
            targetField: "challenge",
            proposedValue:
              draft.challenge.trim() ||
              "Main risk: Web2 substitute. Must prove a stakeable claim and a cold-start path before build.",
            reason: "Capture the challenge in the canonical draft",
          },
          {
            targetField: "risks",
            proposedValue:
              draft.risks.trim() ||
              "Fake Intuition fit; catalog overlap; cold start; wallet friction.",
            reason: "Keep risks explicit",
          },
        ],
      });
  }
}
