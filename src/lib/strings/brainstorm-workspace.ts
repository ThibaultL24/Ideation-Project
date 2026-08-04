// src/lib/strings/brainstorm-workspace.ts

export const workspaceStrings = {
  kicker: "Brainstorm",
  preparePublish: "Prepare & publish",
  draftTab: "Draft & refine",
  publishTab: "Prepare & publish",
  refineHint:
    "Use the helpers above, refine the draft fields below, then Prepare & publish for GitHub PR and on-chain attestation (you confirm before anything is published).",
  archetypeTitle: "Intuition archetype",
  semanticLinter: "Semantic linter",
  draftReady: "Draft is structured enough for a PR and on-chain plan.",
  coreTriple: "Core triple",
  saveDraft: "Save draft",
  saved: "Saved",
  catalogCard: "Catalog entry",
  backThemes: "Back to themes",
  newProject: "Start a new project",
  ideaNotFound: "Idea not found",
  ideaNotFoundDetail:
    "This free-form idea is not stored on this device. Restart the Brainstorm flow.",
  backBrainstorm: "Back to Brainstorm",
  loading: "Loading…",
  sections: {
    problem: {
      label: "Problem",
      placeholder: "Who hurts, how often? How do people cope today?",
    },
    solution: {
      label: "Solution",
      placeholder: "What does the product do? User journey in 3 steps.",
    },
    users: {
      label: "Target users",
      placeholder: "The first 100 users, specifically.",
    },
    intuitionFit: {
      label: "Why Intuition",
      placeholder: "Atoms, triples, staking — what is essential?",
    },
    mvp: {
      label: "MVP",
      placeholder: "Three screens or workflows for a hackathon version.",
    },
    risks: {
      label: "Risks",
      placeholder: "Redundancy, cold start, crypto UX, graph quality.",
    },
    challenge: {
      label: "Challenge",
      placeholder: "Why might this idea fail? What must be proven?",
    },
    supportTriples: {
      label: "Support triples",
      placeholder: "One per line. Example: StakeReview -> targets -> consumers",
    },
  },
  archetypes: {
    "curated-list": { label: "Curated list", hint: "rank, recommend, discover" },
    reputation: { label: "Reputation", hint: "reviews, scores, trust" },
    "social-attestation": { label: "Attestations", hint: "peer proofs" },
    "risk-detection": { label: "Risk", hint: "fraud, security, alerts" },
    "prediction-signal": { label: "Signal", hint: "markets, prediction, conviction" },
    "agent-memory": { label: "AI agents", hint: "memory, context, RAG" },
  },
} as const;
