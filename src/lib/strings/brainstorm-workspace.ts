// src/lib/strings/brainstorm-workspace.ts

export const workspaceStrings = {
  kicker: "Brainstorm workspace",
  pageLead:
    "This page turns a rough idea into a publishable Intuition proposal. Work top to bottom — or skip ahead if you already know what you need.",
  howItWorksTitle: "How this page works",
  howItWorks: [
    {
      step: "1",
      title: "Optional reflection",
      text: "Quick AI read of strengths, weaknesses, and catalog overlap. Apply it only if it helps.",
    },
    {
      step: "2",
      title: "Workshop helpers",
      text: "Pick what the idea still needs (clarity, Intuition fit, MVP…). Suggestions can fill the draft fields for you.",
    },
    {
      step: "3",
      title: "Edit the canonical draft",
      text: "This is the proposal that will go to GitHub and on-chain. Review every field before you publish.",
    },
    {
      step: "4",
      title: "Prepare & publish",
      text: "Open a PR, then attest on Intuition. Nothing is published until you confirm.",
    },
  ],
  preparePublish: "Prepare & publish",
  draftTab: "Draft & refine",
  publishTab: "Prepare & publish",
  statusTitle: "Current status",
  statusLead:
    "Where this idea already stands in the catalog, on GitHub, and on-chain. Useful context — not a blocker to keep editing.",
  reflectionStep: "Step 1 · Optional reflection",
  workshopStep: "Step 2 · Workshop helpers",
  draftStep: "Step 3 · Your publishable draft",
  draftStepLead:
    "These fields are the canonical proposal. Workshop suggestions write into them when you apply. Edit freely afterward.",
  refineHint:
    "When the draft looks solid, switch to Prepare & publish for the GitHub PR and on-chain attestation.",
  archetypeTitle: "Intuition archetype",
  archetypeLead: "Pick the closest shape — this guides how the idea uses the Intuition graph.",
  semanticLinter: "Ready to publish?",
  draftReady: "Draft looks structured enough for a PR and on-chain plan.",
  coreTriple: "Core triple (always the same shape)",
  coreTripleLead:
    "On-chain, your idea will be linked as: [title] — top project ideas for — Intuition.",
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
    "prediction-signal": {
      label: "Signal",
      hint: "markets, prediction, conviction",
    },
    "agent-memory": { label: "AI agents", hint: "memory, context, RAG" },
  },
} as const;
