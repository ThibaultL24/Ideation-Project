// src/lib/assist/fallback-ideation-synthesize.ts
import type { IdeationAnswer } from "@/lib/ideas/ideation-session";

function answerText(answers: IdeationAnswer[], id: string): string {
  return answers.find((a) => a.questionId === id)?.text.trim() ?? "";
}

export function buildFallbackIdeationSynthesis(params: {
  intent: string;
  answers: IdeationAnswer[];
  catalogTitle?: string;
}) {
  const intuition = answerText(params.answers, "intuition_why");
  const feature = answerText(params.answers, "key_feature");
  const inspirations = answerText(params.answers, "inspirations");
  const users = answerText(params.answers, "users");
  const perspectives = answerText(params.answers, "perspectives");

  const headline = params.catalogTitle ?? params.intent.slice(0, 60).trim();

  return {
    headline,
    reflection: [
      params.intent,
      feature ? `Core feature: ${feature}.` : "",
      inspirations ? `Inspirations: ${inspirations}.` : "",
      intuition ? `Intuition link: ${intuition}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
    perspectives: [
      perspectives || "Minimal testnet version with a single pilot community.",
      "Community curation layer with signal instead of likes.",
      params.catalogTitle
        ? `Differentiation from catalog entry « ${params.catalogTitle} ».`
        : "GitHub publication + idea atom on the Intuition graph.",
    ].filter(Boolean),
    appDescription: [params.intent, feature, intuition].filter(Boolean).join("\n\n"),
    intuitionFit:
      intuition ||
      "Create an atom for the idea and the triple [Idea] - [top project ideas for] - [Intuition]; staking qualifies key claims.",
    mvp: feature
      ? `MVP: ${feature} — short loop with 10-50 early users (${users || "TBD"}).`
      : "One journey: describe → attest → read signal on the graph.",
    risks: [
      "Cold start without initial content or users.",
      "Crypto UX if staking arrives before product value.",
      "Duplicate risk in the catalog or on GitHub.",
    ],
  };
}
