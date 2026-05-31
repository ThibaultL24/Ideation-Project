// src/lib/assist/refine-triple-draft.ts
import {
  BOUNTY_PREDICATE_LABEL,
  INTUITION_PROTOCOL_OBJECT_LABEL,
} from "@/lib/intuition/config";
import type { IdeaBrief } from "@/lib/workshop/idea-brief";
import {
  defaultCoreTriple,
  type TripleDraft,
  type TripleLine,
} from "@/lib/workshop/triple-draft";

const VAGUE_PREDICATE =
  /\b(is good|are good|has quality|is best|is great|is innovative|related to|about)\b|^(is|are|has|have|good|best|great|quality|innovative)$/i;

const VAGUE_OBJECT =
  /^(users?|people|everyone|blockchain|web3|early adopters?|quality|trust)$/i;

function shortenPhrase(text: string, max = 48): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trim() + "…";
}

function pickPredicate(
  preferred: string[],
  popular: Array<{ label: string }>,
): string {
  for (const p of preferred) {
    const hit = popular.find((x) => x.label.toLowerCase() === p.toLowerCase());
    if (hit) return hit.label;
  }
  const fallback = popular.find((x) => preferred.some((p) => x.label.toLowerCase().includes(p)));
  return fallback?.label ?? preferred[0] ?? "targets";
}

function buildSupportFromBrief(
  title: string,
  brief: IdeaBrief | undefined,
  popularPredicates: Array<{ label: string }>,
): TripleLine[] {
  if (!brief) return [];

  const lines: TripleLine[] = [];
  const target = brief.targetUsers.split(/[.,;\n]/)[0]?.trim();
  if (target && target.length > 5) {
    lines.push({
      subject: title,
      predicate: pickPredicate(["targets", "built for", "for"], popularPredicates),
      object: shortenPhrase(target, 40),
      rationale: "Segment utilisateur issu de la fiche produit.",
      kind: "support",
      recommended: true,
    });
  }

  const problem = brief.problem.split(/[.!?]/)[0]?.trim();
  if (problem && problem.length > 10) {
    lines.push({
      subject: title,
      predicate: pickPredicate(["solves", "addresses", "fixes"], popularPredicates),
      object: shortenPhrase(problem, 50),
      rationale: "Problème ciblé issu de la fiche produit.",
      kind: "support",
      recommended: true,
    });
  }

  const mechanism = brief.trustMechanism.split(/[.!?]/)[0]?.trim();
  if (mechanism && mechanism.length > 15) {
    lines.push({
      subject: title,
      predicate: pickPredicate(["uses", "relies on", "has feature"], popularPredicates),
      object: shortenPhrase(mechanism, 50),
      rationale: "Mécanisme de confiance issu de la fiche produit.",
      kind: "support",
      recommended: true,
    });
  }

  return lines.slice(0, 3);
}

function isValidSupportLine(line: TripleLine, title: string): boolean {
  if (line.subject.toLowerCase() !== title.toLowerCase()) return false;
  if (line.predicate.toLowerCase() === BOUNTY_PREDICATE_LABEL.toLowerCase()) return false;
  if (VAGUE_PREDICATE.test(line.predicate.trim())) return false;
  if (VAGUE_OBJECT.test(line.object.trim())) return false;
  if (line.object.length > 60 || line.predicate.length > 35) return false;
  if (line.predicate.split(/\s+/).length > 4) return false;
  return true;
}

export function refineTripleDraft(
  draft: TripleDraft,
  options: {
    ideaTitle: string;
    ideaBrief?: IdeaBrief;
    popularPredicates?: Array<{ label: string }>;
    coreAlreadyExists?: boolean;
  },
): TripleDraft {
  const title = options.ideaBrief?.title?.trim() || options.ideaTitle.trim() || "New Idea";
  const popular = options.popularPredicates ?? [];

  const core = defaultCoreTriple(title);
  if (options.coreAlreadyExists) {
    core.rationale =
      "Triple bounty standard de l'écosystème — peut déjà exister on-chain ; documenté dans la PR.";
  }

  const filteredSupport = (draft.supportTriples ?? []).filter((t) =>
    isValidSupportLine(t, title),
  );

  const seen = new Set<string>();
  const support: TripleLine[] = [];
  for (const t of filteredSupport) {
    const key = `${t.predicate.toLowerCase()}|${t.object.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    support.push({ ...t, subject: title, kind: "support", recommended: true });
    if (support.length >= 4) break;
  }

  if (support.length < 2) {
    for (const t of buildSupportFromBrief(title, options.ideaBrief, popular)) {
      const key = `${t.predicate.toLowerCase()}|${t.object.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      support.push(t);
      if (support.length >= 4) break;
    }
  }

  const nested = (draft.nestedTriples ?? [])
    .filter((t) => t.subject && t.predicate && t.object && t.object.length <= 60)
    .slice(0, 2)
    .map((t) => ({ ...t, kind: "nested" as const, recommended: false }));

  const notes = [...(draft.protocolNotes ?? [])];
  if (!notes.some((n) => n.includes("Intuition Protocol"))) {
    notes.push(
      `Triple cœur obligatoire : [${title}] → ${BOUNTY_PREDICATE_LABEL} → ${INTUITION_PROTOCOL_OBJECT_LABEL}.`,
    );
  }

  return {
    ...draft,
    ideaTitle: title,
    coreTriple: core,
    supportTriples: support,
    nestedTriples: nested,
    protocolNotes: notes.slice(0, 6),
  };
}
