// src/lib/assist/fallback-brainstorm.ts
import type { BrainstormReport } from "@/lib/workshop/brainstorm";
import type { GenerateBrainstormInput } from "./generate-brainstorm";

function detectThemes(prompt: string): {
  label: string;
  consumer: string;
  b2b: string;
  supply: string;
} {
  const p = prompt.toLowerCase();
  if (/cinema|film|movie|cinel/.test(p)) {
    return {
      label: "cinema & culture",
      consumer: "cinéphiles and festival-goers",
      b2b: "arthouse venues and programmers",
      supply: "critics and curators",
    };
  }
  if (/gps|map|heritage|histor|culturel|cultural/.test(p)) {
    return {
      label: "cultural place & memory",
      consumer: "urban explorers and students",
      b2b: "museums and tourism boards",
      supply: "historians and local guides",
    };
  }
  if (/trust|reputation|review|stake/.test(p)) {
    return {
      label: "portable trust",
      consumer: "buyers comparing providers",
      b2b: "marketplaces and platforms",
      supply: "verified professionals",
    };
  }
  return {
    label: "Intuition-native products",
    consumer: "early adopters in web3",
    b2b: "teams building on attestations",
    supply: "domain experts and moderators",
  };
}

export function buildFallbackBrainstorm(input: GenerateBrainstormInput): BrainstormReport {
  const themes = detectThemes(input.explorationPrompt);
  const catalogHint = input.catalogMatches[0]?.title ?? "catalog neighbors";
  const base = input.ideaTitle || "New Idea";

  const directions = [
    {
      id: "direction-1",
      title: `${base} Atlas`,
      tagline: `A consumer app for ${themes.consumer} with stake-ranked claims instead of opaque reviews.`,
      angle: "Consumer",
      problemHook: `${themes.consumer} cannot tell which recommendations are honest, fresh, or paid-for. Today they juggle fragmented apps with no portable reputation when they switch platforms.`,
      intuitionFit:
        "Each venue, work, or claim becomes an atom; quality and relevance are triples with vaults. Users and curators stake on recommendations; readers query stake totals before trusting a pick.",
      mvpSketch:
        "One city or niche catalog, 50 seeded claims, read-only graph in the app, simple 'agree / counter' staking on three predicates. No full social network in v1.",
      whyInteresting:
        `Differentiates from ${catalogHint}-style listings by making disagreement visible and priced — not buried in stars.`,
      risks: ["Cold-start content", "Need credible first stakers", "UX complexity for casual users"],
    },
    {
      id: "direction-2",
      title: `${base} Studio`,
      tagline: `B2B dashboard for ${themes.b2b} to publish attestable claims before any consumer app exists.`,
      angle: "B2B / supply",
      problemHook: `${themes.b2b} already create content but lack a shared credibility layer across partners and channels. Internal CMS tools do not travel with the institution's reputation.`,
      intuitionFit:
        "Institutions mint atoms for programs and events; staff stake on accuracy and attendance claims. Partners read the same graph — no proprietary review silo per venue.",
      mvpSketch:
        "Web-only publisher, 3 roles (admin, curator, reviewer), CSV import, preview vault economics, export triples for PR documentation.",
      whyInteresting: "Seeds the graph from the supply side — lowers consumer MVP risk.",
      risks: ["Sales cycle length", "Requires domain champion", "Integration with existing CMS"],
    },
    {
      id: "direction-3",
      title: `${base} Signal API`,
      tagline: "Embeddable trust scores for apps that do not want to rebuild reputation infrastructure.",
      angle: "Platform / API",
      problemHook:
        "Developers in " +
        themes.label +
        " build fast but copy fake review patterns. They need portable trust without running their own moderation army.",
      intuitionFit:
        "Expose GraphQL + stake aggregates for entity atoms; apps deposit on claims they care about. Intuition stays the source of truth; partners are distribution.",
      mvpSketch:
        "REST/GraphQL wrapper, 3 endpoints (entity score, top claims, deposit), docs + sandbox, one pilot partner integration.",
      whyInteresting: "Aligns with Trust API / embeddable patterns in the Intuition catalog.",
      risks: ["API abuse", "Pricing model unclear", "Depends on graph density"],
    },
    {
      id: "direction-4",
      title: `${base} Guild`,
      tagline: `Community-owned curation where ${themes.supply} compete on stake-backed expertise.`,
      angle: "Community",
      problemHook: `Expert ${themes.supply} are underpaid and their track records do not follow them across platforms. Fans cannot fund quality curation directly.`,
      intuitionFit:
        "Guild members are identity atoms; contributions are triples (curated, verified, endorsed). Fans stake on curators; slashing via counter-stake on bad picks.",
      mvpSketch:
        "Discord + web leaderboard, weekly curation challenge, on-chain stakes on 10 claims, no mobile app in v1.",
      whyInteresting: "Strong narrative for decentralized curation — good for ecosystem storytelling.",
      risks: ["Moderation politics", "Token/legal framing", "Slow growth without celebrity seed"],
    },
    {
      id: "direction-5",
      title: `${base} Lens`,
      tagline: "Narrow wedge: one controversial claim type done perfectly (e.g. 'worth the trip' or 'faithful adaptation').",
      angle: "Wedge / focus",
      problemHook:
        "Broad apps fail because every claim type needs different evidence. A single predicate family can be legible and stake-dense quickly.",
      intuitionFit:
        "One canonical predicate + object taxonomy; all UI optimized for staking on that claim only. Graph stays clean — avoids semantic pollution.",
      mvpSketch:
        "Single-screen stake flow, 100 target entities in one category, leaderboard of predictors, export core triple for bounty PR.",
      whyInteresting: "Fastest path to a legible demo on testnet with minimal atoms.",
      risks: ["May feel too small", "Hard to expand later", "Needs vivid demo data"],
    },
  ];

  return {
    territory: `You are exploring ${themes.label} without a fixed product yet — the Intuition ecosystem already has adjacent ideas such as « ${catalogHint} », but there is room to differentiate via audience, wedge, or business model. The white space is not "another app" but **which claims** get staked, **who** seeds supply, and **how** reputation travels. Brainstorm below contrasts consumer, B2B, platform, community, and narrow-wedge paths so you can commit before deep research.`,
    clarifyingQuestions: [
      "Do you want to serve end-users directly, or empower institutions/experts who already have an audience?",
      "What is your unfair advantage: domain knowledge, distribution, design, or protocol fluency?",
      "Are you optimizing for a fast testnet demo or a fundable long-term marketplace?",
      "Which existing product would your ideal user abandon if yours worked?",
      "How comfortable are you with visible disagreement (counter-stakes) in the UX?",
    ],
    directions,
    recommendedDirectionId: "direction-1",
    generatedAt: new Date().toISOString(),
  };
}
