// src/lib/workshop/prepare-pr-guide.ts
import { BOUNTY_PREDICATE_LABEL, INTUITION_PROTOCOL_OBJECT_LABEL } from "@/lib/intuition/config";
import type { WorkshopPath } from "./workshop-path";

export interface PreparePrGuideSection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface PreparePrGuide {
  headline: string;
  summary: string;
  ideaTitle: string;
  coreTripleLine: string;
  sections: PreparePrGuideSection[];
  checklist: string[];
}

export function buildPreparePrGuide(params: {
  ideaTitle: string;
  coreSubject: string;
  tagline: string;
  githubPath: string;
  workshopPath?: WorkshopPath;
  catalogAlreadyOnchain?: boolean;
}): PreparePrGuide {
  const objectLabel = INTUITION_PROTOCOL_OBJECT_LABEL;
  const coreTripleLine = `[${params.coreSubject}] → [${BOUNTY_PREDICATE_LABEL}] → [${objectLabel}]`;

  const checklist = [
    "One atom = one thing (short label, not « X and Y »).",
    `Core triple: ${coreTripleLine}.`,
    "Stable predicates, nameable objects (mirror the existing graph).",
    "Support and nested triples: preview in the PR only.",
    "No on-chain transactions from the workshop — community review via GitHub PR.",
  ];

  if (params.catalogAlreadyOnchain) {
    checklist.push(
      "This catalog idea may already exist on testnet — the PR documents the model without recreating on-chain terms.",
    );
  }

  return {
    headline: "GitHub pull request — Intuition semantic model in README",
    summary: `You are about to propose « ${params.ideaTitle} » to the Intuition community via intuition-box/ideas. The PR is the deliverable: a structured README that humans review before anything goes on-chain.`,
    ideaTitle: params.ideaTitle,
    coreTripleLine,
    sections: [
      {
        id: "vision",
        title: "What this workshop does",
        paragraphs:
          params.workshopPath === "precise"
            ? [
                "You arrived with a clear product idea and skipped brainstorming. Prepare is the only step that matters here: document triples in the README and open a GitHub PR.",
                "No wallet, no on-chain publish from this app — community review on intuition-box/ideas comes first.",
              ]
            : [
                "This workshop helps you explore a territory, pick a direction you like, optionally deepen it with research, then publish when you are ready.",
                "Prepare is the final step of the brainstorm path: when the idea pleases you, you push the PR from here. You can also open Prepare right after choosing a direction, without waiting for full deep research.",
                "Nothing is minted on-chain from this screen — the PR is for human review before any graph publication.",
              ],
      },
      {
        id: "paths",
        title: "Two ways to reach Prepare",
        bullets: [
          "Explore: /workshop → brainstorm → pick a direction → (optional deep research) → Prepare → Create GitHub PR.",
          "Precise idea: /workshop → « I have a clear idea » → Prepare → triples → Create GitHub PR.",
          "Deep research enriches the README but is not required if you already like a brainstorm direction.",
        ],
      },
      {
        id: "pr-contains",
        title: "What goes into the PR",
        bullets: [
          `A new file under ideas/ (e.g. ${params.githubPath}) with YAML frontmatter and your full brief.`,
          `Tagline: ${params.tagline || "your one-liner from research"}.`,
          "Problem, solution, target users, why now, Intuition angle, trust mechanism, MVP scope, and open questions from your saved brief sheet.",
          "Research diagnostic (strengths / weaknesses) when available from deep research.",
          "Intuition integration section: refined pitch plus documented triples (core, support, nested).",
          "Your original exploration intent for traceability.",
        ],
      },
      {
        id: "semantic-model",
        title: "The Intuition semantic model (in the README)",
        paragraphs: [
          "Intuition represents knowledge as atoms (things) and triples (claims: subject → predicate → object). Your PR documents how this product would plug into that graph — so reviewers see a coherent model before anyone stakes or publishes on-chain.",
          `For bounty-aligned ideas, the required anchor is the core triple: ${coreTripleLine}. It links your product atom to the protocol the same way hundreds of catalog ideas do.`,
        ],
        bullets: [
          "Atom (idea): a short product name — e.g. « StoryExplorer », not your full user sentence.",
          `Predicate: « ${BOUNTY_PREDICATE_LABEL} » — the canonical bounty framing.`,
          `Object: « ${objectLabel} » — ties the idea to the ecosystem.`,
          "Support triples: extra claims (audience, wedge, trust loop) shown as suggestions in the README.",
          "Nested triples: provenance or scope notes — documentation only in this flow.",
        ],
      },
      {
        id: "rules",
        title: "Semantic rules (why these constraints)",
        bullets: [
          "One atom = one thing — avoid compound labels like « Maps and social network »; split or pick the primary noun.",
          "Stable predicates — reuse patterns already on the graph (targets, uses, has feature) instead of inventing one-off wording.",
          "Nameable objects — every object term should be a thing you could find or create as an atom later.",
          "Do not pollute the graph from the workshop — incorrect triples are worse than a clear README preview.",
        ],
      },
      {
        id: "not-included",
        title: "What Prepare does not do",
        bullets: [
          "No wallet connection and no INTUITION_PRIVATE_KEY required for this step.",
          "No atom creation, triple minting, or staking from this app.",
          "On-chain publication remains a separate, community-driven step after the PR is reviewed and accepted.",
        ],
      },
      {
        id: "after-pr",
        title: "After the PR is open",
        bullets: [
          "Community members comment, suggest merges with similar ideas, or ask for sharper differentiation.",
          "If the idea is accepted, contributors can later create atoms/triples on testnet or mainnet following the documented model.",
          "You can link your PR in Discord or forums so others can discover and support the concept.",
        ],
      },
    ],
    checklist,
  };
}
