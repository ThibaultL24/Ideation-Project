// src/lib/ideas/brainstorm-session.ts
import {
  BOUNTY_PREDICATE_LABEL,
  IDEA_PREDICATE_LABEL,
} from "@/lib/intuition/config";

export interface BrainstormCanvas {
  problem: string;
  mainActor: string;
  attestedObject: string;
  proofMechanism: string;
  signalRole: string;
  challengeForm: string;
}

export interface BrainstormDraft {
  version: 2;
  refinedPitch: string;
  archetype?: string;
  canvas: BrainstormCanvas;
}

export const EMPTY_CANVAS: BrainstormCanvas = {
  problem: "",
  mainActor: "",
  attestedObject: "",
  proofMechanism: "",
  signalRole: "",
  challengeForm: "",
};

export function defaultDraft(seed?: Partial<BrainstormDraft>): BrainstormDraft {
  return {
    version: 2,
    refinedPitch: seed?.refinedPitch ?? "",
    archetype: seed?.archetype,
    canvas: { ...EMPTY_CANVAS, ...seed?.canvas },
  };
}

export function draftStorageKey(slug: string) {
  return `brainstorm-draft:${slug}`;
}

export interface SemanticLint {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export interface SemanticDraft {
  ideaAtomLabel: string;
  predicate: string;
  object: string;
  coreTriple: [string, string, string];
  supportTriplesSuggested: Array<[string, string, string]>;
}

export function buildSemanticDraft(
  ideaTitle: string,
  canvas: BrainstormCanvas,
): SemanticDraft {
  const ideaAtomLabel = ideaTitle.trim() || "Untitled Idea";
  const object = "Intuition";
  const predicate = BOUNTY_PREDICATE_LABEL;

  const support: Array<[string, string, string]> = [];
  if (canvas.mainActor.trim()) {
    support.push([ideaAtomLabel, "targets", canvas.mainActor.trim()]);
  }
  if (canvas.problem.trim()) {
    support.push([ideaAtomLabel, "solves", canvas.problem.trim().slice(0, 80)]);
  }

  return {
    ideaAtomLabel,
    predicate,
    object,
    coreTriple: [ideaAtomLabel, predicate, object],
    supportTriplesSuggested: support,
  };
}

export function runSemanticLints(
  draft: SemanticDraft,
  existence: {
    subjectExists: boolean;
    predicateExists: boolean;
    objectExists: boolean;
    tripleExists: boolean;
  },
): SemanticLint[] {
  const label = draft.ideaAtomLabel;
  const lints: SemanticLint[] = [];

  lints.push({
    id: "single-thing",
    label: "Un Atom = une chose",
    status: /\band\b|\bet\b|,.*,|\//i.test(label) ? "warn" : "pass",
    detail: /\band\b|\bet\b/i.test(label)
      ? "Évitez les libellés composites — scindez en plusieurs Atoms."
      : "Libellé atomique OK.",
  });

  lints.push({
    id: "label-clarity",
    label: "Libellé clair et réutilisable",
    status:
      label.length >= 3 && label.length <= 80
        ? "pass"
        : label.length < 3
          ? "fail"
          : "warn",
    detail:
      label.length < 3
        ? "Titre trop court."
        : label.length > 80
          ? "Raccourcissez pour un libellé canonique."
          : "Longueur adaptée.",
  });

  lints.push({
    id: "canonical-subject",
    label: "Atom sujet (existe déjà ?)",
    status: existence.subjectExists ? "warn" : "pass",
    detail: existence.subjectExists
      ? "Un terme proche existe — réutilisez-le si possible."
      : "Nouveau sujet probable.",
  });

  lints.push({
    id: "predicate-vocab",
    label: "Prédicat contrôlé",
    status:
      draft.predicate === IDEA_PREDICATE_LABEL ||
      draft.predicate === BOUNTY_PREDICATE_LABEL
        ? "pass"
        : "warn",
    detail: `Prédicat bounty : « ${IDEA_PREDICATE_LABEL} ».`,
  });

  lints.push({
    id: "core-triple",
    label: "Triple cœur",
    status: existence.tripleExists ? "warn" : "pass",
    detail: existence.tripleExists
      ? "Ce triple semble déjà indexé."
      : "Prêt à créer (sans stake initial obligatoire).",
  });

  lints.push({
    id: "nested-depth",
    label: "Nested triples",
    status: "pass",
    detail: "Mode avancé — réservé à provenance / timing (V2+).",
  });

  return lints;
}

export function buildMarkdownPreview(
  ideaTitle: string,
  tagline: string,
  draft: BrainstormDraft,
  semantic: SemanticDraft,
): string {
  const { canvas } = draft;
  return `# ${ideaTitle}

> ${draft.refinedPitch || tagline}

## Problème
${canvas.problem || "_À compléter_"}

## Acteur principal
${canvas.mainActor || "_À compléter_"}

## Objet attesté / curé
${canvas.attestedObject || "_À compléter_"}

## Mécanisme de preuve / ranking
${canvas.proofMechanism || "_À compléter_"}

## Rôle du signal
${canvas.signalRole || "_À compléter_"}

## Challenge / contre-lecture
${canvas.challengeForm || "_À compléter_"}

## Triple cœur (bounty)
\`${semantic.coreTriple.join(" → ")}\`
`;
}
