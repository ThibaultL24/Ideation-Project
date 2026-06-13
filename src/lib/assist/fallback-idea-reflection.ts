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
      `${idea.title} part du catalogue Intuition comme piste concrète : ${idea.tagline}`,
      idea.description.slice(0, 400),
      angle ? `Angle personnel : ${angle}` : "",
      "La réflexion consiste à transformer cette fiche en proposition produit vérifiable : problème réel, utilisateurs précis, boucle MVP, et claims Intuition (atoms/triples) qui portent la confiance.",
    ]
      .filter(Boolean)
      .join(" "),
    strengths: [
      `Proposition déjà structurée dans le catalogue (${idea.category}).`,
      `Tagline claire : ${idea.tagline}`,
      "Triple cœur bounty prêt : [Idea] - [top project ideas for] - [Intuition].",
    ],
    weaknesses: [
      "La fiche catalogue reste générique — il faut préciser le premier utilisateur et le premier workflow.",
      "Le fit Intuition doit nommer explicitement quels claims sont stakés et par qui.",
      "Risque de doublon si une idée proche existe déjà on-chain ou sur GitHub.",
    ],
    problem: idea.description.slice(0, 500) || idea.tagline,
    solution: `${idea.title} : ${idea.tagline}. ${angle ?? "À préciser dans le brouillon."}`,
    users:
      "Builders et membres de la communauté Intuition qui testent des idées produit avant publication GitHub + on-chain.",
    intuitionFit: `Créer ou réutiliser l'atom « ${idea.title} » et le triple [${idea.title}] - [top project ideas for] - [Intuition]. Le signal (staking) peut ensuite qualifier la qualité de la proposition.`,
    mvp:
      "Écran idée → vérification état existant → brouillon affiné → PR intuition-box/ideas → publish on-chain.",
    risks: [
      "Cold start si personne ne stake sur la proposition.",
      "Fragmentation du graphe si les prédicats de soutien sont publiés trop tôt.",
      "UX crypto si le staking est demandé avant la valeur produit.",
    ],
    challenge:
      "Prouver qu'un utilisateur non technique comprend pourquoi cette idée mérite d'être scoped et soutenue sur Intuition.",
    archetype,
    ecosystemNote:
      overlapMessage?.trim() ||
      "Vérifiez le graphe et intuition-box/ideas avant de publier de nouveaux atoms.",
    generatedAt: new Date().toISOString(),
  };
}
