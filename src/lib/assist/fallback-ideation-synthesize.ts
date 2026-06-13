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
      feature ? `Feature centrale : ${feature}.` : "",
      inspirations ? `Inspirations : ${inspirations}.` : "",
      intuition ? `Lien Intuition : ${intuition}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
    perspectives: [
      perspectives || "Version minimale testnet avec une seule communauté pilote.",
      "Couche de curation communautaire avec signal plutôt que likes.",
      params.catalogTitle
        ? `Différenciation par rapport à « ${params.catalogTitle} » du catalogue.`
        : "Publication GitHub + atom d'idée sur le graphe Intuition.",
    ].filter(Boolean),
    appDescription: [params.intent, feature, intuition].filter(Boolean).join("\n\n"),
    intuitionFit:
      intuition ||
      "Créer un atom pour l'idée et le triple [Idea] - [top project ideas for] - [Intuition]; le staking qualifie les claims clés.",
    mvp: feature
      ? `MVP : ${feature} — boucle courte avec 10-50 premiers utilisateurs (${users || "à préciser"}).`
      : "Un parcours : décrire → attester → lire le signal sur le graphe.",
    risks: [
      "Cold start sans contenu ou utilisateurs initiaux.",
      "UX crypto si le staking arrive avant la valeur produit.",
      "Risque de doublon dans le catalogue ou sur GitHub.",
    ],
  };
}
