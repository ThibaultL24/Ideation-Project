// src/lib/assist/fallback-ideation-challenge.ts

export function buildFallbackIdeationChallenge(params: {
  headline: string;
  intuitionFit: string;
  overlapMessage?: string;
}) {
  return {
    mainObjection: `« ${params.headline} » doit prouver que le staking apporte plus que des likes ou des votes classiques. Si les utilisateurs n'ont aucune raison de mettre de la valeur derrière leurs claims, l'idée fonctionne aussi bien en Web2 — et donc Intuition n'est plus nécessaire.`,
    counterDirection:
      "Et si la première version inversait la logique : au lieu de demander aux utilisateurs de staker, l'app lit le signal existant du graphe Intuition pour classer ou recommander, et n'introduit le staking qu'une fois la valeur démontrée.",
    killerAssumptions: [
      "Les premiers utilisateurs acceptent de staker (ou au moins d'attester) sans incitation financière immédiate.",
      `Le fit Intuition est réel : ${params.intuitionFit.slice(0, 120)}…`,
      "Le cold start est surmontable avec une seule communauté pilote.",
    ],
    openQuestions: [
      "Quel est le premier claim concret sur lequel quelqu'un stakerait ?",
      "Que voit un utilisateur qui arrive quand le graphe est encore vide ?",
      params.overlapMessage
        ? `Comment se différencier de l'existant ? (${params.overlapMessage})`
        : "Existe-t-il déjà un atom ou une idée proche sur le graphe ?",
    ],
    verdict:
      "Idée à potentiel, mais le « pourquoi Intuition » doit être prouvé par un cas d'usage précis avant de construire. Stress test local (sans IA) — relancez avec une clé OpenAI pour une critique plus fine.",
  };
}
