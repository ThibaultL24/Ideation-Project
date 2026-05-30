// src/lib/workshop/triple-draft.ts
import { BOUNTY_PREDICATE_LABEL } from "@/lib/intuition/config";

export interface TripleLine {
  subject: string;
  predicate: string;
  object: string;
  rationale: string;
  kind: "core" | "support" | "nested";
  recommended: boolean;
}

export interface TripleDraft {
  ideaTitle: string;
  refinedPitch: string;
  archetypeSummary: string;
  coreTriple: TripleLine;
  supportTriples: TripleLine[];
  nestedTriples: TripleLine[];
  protocolNotes: string[];
  linterWarnings: string[];
}

export const EMPTY_TRIPLE_DRAFT: TripleDraft = {
  ideaTitle: "",
  refinedPitch: "",
  archetypeSummary: "",
  coreTriple: {
    subject: "",
    predicate: BOUNTY_PREDICATE_LABEL,
    object: "Intuition",
    rationale: "Lien bounty : idée de projet pour l'écosystème Intuition.",
    kind: "core",
    recommended: true,
  },
  supportTriples: [],
  nestedTriples: [],
  protocolNotes: [],
  linterWarnings: [],
};

export function defaultCoreTriple(ideaTitle: string): TripleLine {
  const subject = ideaTitle.trim() || "Untitled Idea";
  return {
    subject,
    predicate: BOUNTY_PREDICATE_LABEL,
    object: "Intuition",
    rationale: "Triple obligatoire du bounty : relie l'idée au protocole.",
    kind: "core",
    recommended: true,
  };
}

export function formatTripleLine(line: TripleLine): string {
  return `${line.subject} → ${line.predicate} → ${line.object}`;
}

export function runTripleLinter(draft: TripleDraft): string[] {
  const warnings: string[] = [];
  const label = draft.coreTriple.subject;

  if (label.length < 3) warnings.push("Le label d'atom doit nommer une chose identifiable.");
  if (/\band\b|\bet\b|,.*,|\//i.test(label)) {
    warnings.push("Évite les labels composites (« X et Y ») — un atom = une chose.");
  }
  if (draft.coreTriple.predicate !== BOUNTY_PREDICATE_LABEL) {
    warnings.push(`Le triple cœur devrait utiliser le prédicat « ${BOUNTY_PREDICATE_LABEL} ».`);
  }
  if (draft.refinedPitch.trim().length < 40) {
    warnings.push("Le pitch affiné est encore court pour une publication GitHub.");
  }

  for (const t of draft.supportTriples) {
    if (t.predicate.length < 2) warnings.push(`Prédicat trop vague : « ${t.predicate} ».`);
    if (t.object.length > 80) warnings.push(`Objet trop long dans : ${formatTripleLine(t)}.`);
  }

  if (draft.nestedTriples.length > 0 && draft.supportTriples.length === 0) {
    warnings.push("Les triples imbriqués sont avancés : ajoute d'abord des triples de soutien simples.");
  }

  if (draft.nestedTriples.length > 3) {
    warnings.push("Trop de triples imbriqués — risque de polluer le graphe.");
  }

  return warnings;
}

export function normalizeTripleDraft(
  input: Partial<TripleDraft> | null | undefined,
  ideaTitle: string,
): TripleDraft {
  const core = input?.coreTriple ?? defaultCoreTriple(ideaTitle);
  return {
    ...EMPTY_TRIPLE_DRAFT,
    ...input,
    ideaTitle: input?.ideaTitle?.trim() || ideaTitle,
    coreTriple: { ...defaultCoreTriple(ideaTitle), ...core, kind: "core", recommended: true },
    supportTriples: (input?.supportTriples ?? []).map((t) => ({ ...t, kind: "support" as const })),
    nestedTriples: (input?.nestedTriples ?? []).map((t) => ({ ...t, kind: "nested" as const })),
    linterWarnings: input?.linterWarnings ?? [],
  };
}
