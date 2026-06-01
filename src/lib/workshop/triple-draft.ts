// src/lib/workshop/triple-draft.ts
import {
  BOUNTY_PREDICATE_LABEL,
  INTUITION_PROTOCOL_OBJECT_LABEL,
} from "@/lib/intuition/config";

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
    object: INTUITION_PROTOCOL_OBJECT_LABEL,
    rationale: "Bounty link: project idea for the Intuition ecosystem.",
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
    object: INTUITION_PROTOCOL_OBJECT_LABEL,
    rationale: "Required bounty triple: links the idea to the protocol.",
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

  if (label.length < 3) warnings.push("Atom label must name one identifiable thing.");
  if (/\band\b|\bet\b|,.*,|\//i.test(label)) {
    warnings.push('Avoid composite labels ("X and Y") — one atom = one thing.');
  }
  if (draft.coreTriple.predicate !== BOUNTY_PREDICATE_LABEL) {
    warnings.push(`Core triple should use predicate « ${BOUNTY_PREDICATE_LABEL} ».`);
  }
  if (draft.coreTriple.object !== INTUITION_PROTOCOL_OBJECT_LABEL) {
    warnings.push(
      `Core triple object should be « ${INTUITION_PROTOCOL_OBJECT_LABEL} ».`,
    );
  }
  if (draft.refinedPitch.trim().length < 40) {
    warnings.push("Refined pitch is still short for a GitHub publication.");
  }

  for (const t of draft.supportTriples) {
    if (t.predicate.length < 2) warnings.push(`Predicate too vague: « ${t.predicate} ».`);
    if (t.object.length > 80) warnings.push(`Object too long in: ${formatTripleLine(t)}.`);
  }

  if (draft.nestedTriples.length > 0 && draft.supportTriples.length === 0) {
    warnings.push("Nested triples are advanced — add simple support triples first.");
  }

  if (draft.nestedTriples.length > 3) {
    warnings.push("Too many nested triples — risk of graph pollution.");
  }

  return warnings;
}

export function normalizeTripleDraft(
  input: Partial<TripleDraft> | null | undefined,
  ideaTitle: string,
): TripleDraft {
  const label = ideaTitle.trim() || "New Idea";
  return {
    ...EMPTY_TRIPLE_DRAFT,
    ...input,
    ideaTitle: label,
    coreTriple: {
      ...defaultCoreTriple(label),
      predicate: BOUNTY_PREDICATE_LABEL,
      object: INTUITION_PROTOCOL_OBJECT_LABEL,
      kind: "core",
      recommended: true,
      rationale:
        input?.coreTriple?.rationale ??
        "Required bounty triple: links the idea to the protocol.",
    },
    supportTriples: (input?.supportTriples ?? []).map((t) => ({ ...t, kind: "support" as const })),
    nestedTriples: (input?.nestedTriples ?? []).map((t) => ({ ...t, kind: "nested" as const })),
    linterWarnings: input?.linterWarnings ?? [],
  };
}
