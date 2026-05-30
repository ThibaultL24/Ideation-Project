// src/lib/ideas/scamper.ts
export type ScamperLetter = "S" | "C" | "A" | "M" | "P" | "E" | "R";

export interface ScamperStep {
  letter: ScamperLetter;
  verb: string;
  title: string;
  intro: string;
  prompts: string[];
  intuitionHint: string;
}

export interface ScamperAnswers {
  S: string;
  C: string;
  A: string;
  M: string;
  P: string;
  E: string;
  R: string;
}

export interface ScamperDraft {
  version: 1;
  answers: ScamperAnswers;
  synthesis: string;
  completedSteps: ScamperLetter[];
}

const COMBINE_PROMPTS_CATALOG = [
  "Quelle autre idée du catalogue (ou du graphe) combiner avec celle-ci ?",
  "Quelles briques fusionner : curation + réputation, social + prédiction… ?",
  "Quel triple ou atom supplémentaire cette combinaison suggère-t-elle ?",
];

const COMBINE_PROMPTS_FREE = [
  "Quelle autre idée (la vôtre ou une invention) combiner avec celle-ci ?",
  "Quelles briques fusionner : curation + réputation, social + prédiction… ?",
  "Quel lien ou triple cette fusion rend-elle évident ?",
];

export const SCAMPER_STEPS: ScamperStep[] = [
  {
    letter: "S",
    verb: "Substituer",
    title: "Que remplacer ?",
    intro:
      "Identifiez un élément clé de l'idée (acteur, donnée, mécanisme) et imaginez un remplacement.",
    prompts: [
      "Qui ou quoi pourrait être remplacé dans cette idée ?",
      "Par quoi — autre source de vérité, autre utilisateur, autre canal ?",
      "Le remplacement rend-il le graphe Intuition plus utile ?",
    ],
    intuitionHint:
      "Ex. remplacer un classement opaque par des triples attestés et du signal ($TRUST).",
  },
  {
    letter: "C",
    verb: "Combiner",
    title: "Que fusionner ?",
    intro:
      "Deux idées, deux features ou deux patterns Intuition peuvent devenir plus forts ensemble.",
    prompts: COMBINE_PROMPTS_CATALOG,
    intuitionHint:
      "Ex. liste curée + ranking par signal : les utilisateurs stakent sur les entrées qu'ils recommandent.",
  },
  {
    letter: "A",
    verb: "Adapter",
    title: "Que transposer ?",
    intro:
      "Empruntez un pattern qui marche ailleurs et adaptez-le à votre contexte ou à Intuition.",
    prompts: [
      "Quel tutoriel Intuition (listes, réputation, fraude, prédiction) ressemble le plus à votre idée ?",
      "Comment l'adapter à votre secteur ou à votre public ?",
      "Qu'est-ce qui doit changer pour rester natif au protocole ?",
    ],
    intuitionHint:
      "Ex. reprendre le pattern « fraud detection » pour filtrer des idées redondantes dans le catalogue.",
  },
  {
    letter: "M",
    verb: "Modifier",
    title: "Que changer d'échelle ?",
    intro:
      "Amplifiez ou réduisez un aspect : granularité des atoms, fréquence du signal, profondeur du graphe.",
    prompts: [
      "Que grossir (portée, enjeu financier, visibilité) ou réduire (scope MVP) ?",
      "Faut-il des atoms plus fins ou un libellé plus large ?",
      "Le mécanisme de conviction (staking) est-il au bon niveau ?",
    ],
    intuitionHint:
      "Ex. passer d'un atom composite à plusieurs atoms réutilisables — règle « un atom = une chose ».",
  },
  {
    letter: "P",
    verb: "Proposer ailleurs",
    title: "Autre usage ?",
    intro:
      "La même brique peut servir un autre public, un autre marché ou un autre moment du parcours.",
    prompts: [
      "Qui d'autre pourrait utiliser ce produit tel quel ?",
      "Dans quel autre contexte (B2B, communauté, agent IA) ?",
      "Quel nouveau triple « cible → … → … » émergerait ?",
    ],
    intuitionHint:
      "Ex. un outil de curation d'idées hackathon réutilisé pour prioriser des améliorations produit.",
  },
  {
    letter: "E",
    verb: "Éliminer",
    title: "Que retirer ?",
    intro:
      "Simplifiez : moins d'écrans, moins de triples, moins de friction avant la première publication.",
    prompts: [
      "Quelle feature ou étape supprimer pour un MVP en 3 écrans ?",
      "Quels nested triples ou prédicats inventés éviter au départ ?",
      "Qu'est-ce qui n'apporte pas de signal utile au graphe ?",
    ],
    intuitionHint:
      "Ex. publier le triple cœur sans stake initial — le signal vient après validation communautaire.",
  },
  {
    letter: "R",
    verb: "Inverser",
    title: "Que retourner ?",
    intro:
      "Inversez l'ordre, le flux ou la relation sujet–objet pour révéler un angle neuf.",
    prompts: [
      "Et si l'utilisateur commençait par staker avant de créer l'atom ?",
      "Et si la communauté curait avant que l'auteur ne publie ?",
      "Quel counter-claim ou contestation rendrait l'idée plus crédible ?",
    ],
    intuitionHint:
      "Ex. afficher d'abord les idées contestées (counter triples) pour stress-test avant publication.",
  },
];

export const SCAMPER_LETTERS: ScamperLetter[] = [
  "S",
  "C",
  "A",
  "M",
  "P",
  "E",
  "R",
];

export function emptyScamperAnswers(): ScamperAnswers {
  return { S: "", C: "", A: "", M: "", P: "", E: "", R: "" };
}

export function defaultScamperDraft(): ScamperDraft {
  return {
    version: 1,
    answers: emptyScamperAnswers(),
    synthesis: "",
    completedSteps: [],
  };
}

export function scamperStorageKey(slug: string) {
  return `scamper-draft:${slug}`;
}

export function getScamperSteps(mode: "catalog" | "free"): ScamperStep[] {
  if (mode === "catalog") return SCAMPER_STEPS;
  return SCAMPER_STEPS.map((step) =>
    step.letter === "C" ? { ...step, prompts: COMBINE_PROMPTS_FREE } : step,
  );
}

export interface ScamperWorkItem {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  mode: "catalog" | "free";
}

export function stepIndex(letter: ScamperLetter): number {
  return SCAMPER_LETTERS.indexOf(letter);
}

export function nextLetter(letter: ScamperLetter): ScamperLetter | null {
  const idx = stepIndex(letter);
  return idx < SCAMPER_LETTERS.length - 1 ? SCAMPER_LETTERS[idx + 1]! : null;
}

export function prevLetter(letter: ScamperLetter): ScamperLetter | null {
  const idx = stepIndex(letter);
  return idx > 0 ? SCAMPER_LETTERS[idx - 1]! : null;
}

export function isStepComplete(answers: ScamperAnswers, letter: ScamperLetter): boolean {
  return answers[letter].trim().length >= 10;
}

export function completedCount(answers: ScamperAnswers): number {
  return SCAMPER_LETTERS.filter((l) => isStepComplete(answers, l)).length;
}

/** Synthèse auto à partir des réponses SCAMPER — alimente le brainstorm. */
export function buildScamperSynthesis(
  ideaTitle: string,
  answers: ScamperAnswers,
): string {
  const parts: string[] = [`Idée de départ : ${ideaTitle}.`];

  for (const step of SCAMPER_STEPS) {
    const note = answers[step.letter].trim();
    if (note.length >= 10) {
      parts.push(`${step.verb} : ${note}`);
    }
  }

  return parts.join("\n\n");
}

export function mergeSynthesisIntoBrainstormDraft(
  slug: string,
  synthesis: string,
): void {
  if (typeof window === "undefined") return;
  const key = `brainstorm-draft:${slug}`;
  const raw = localStorage.getItem(key);
  let draft: Record<string, unknown> = {
    version: 2,
    refinedPitch: synthesis,
    canvas: {
      problem: "",
      mainActor: "",
      attestedObject: "",
      proofMechanism: "",
      signalRole: "",
      challengeForm: "",
    },
  };

  if (raw) {
    try {
      const existing = JSON.parse(raw) as Record<string, unknown>;
      draft = { ...existing, refinedPitch: synthesis };
    } catch {
      /* use default */
    }
  }

  localStorage.setItem(key, JSON.stringify(draft));
}
