// src/lib/assist/refine-triple-draft.ts
import {
  BOUNTY_PREDICATE_LABEL,
  INTUITION_PROTOCOL_OBJECT_LABEL,
} from "@/lib/intuition/config";
import {
  deriveAtomLabel,
  isIntentLikeLabel,
  isPlaceholderBriefText,
} from "@/lib/workshop/atom-label";
import type { IdeaBrief } from "@/lib/workshop/idea-brief";
import {
  defaultCoreTriple,
  type TripleDraft,
  type TripleLine,
} from "@/lib/workshop/triple-draft";

const VAGUE_PREDICATE =
  /\b(is good|are good|has quality|is best|is great|is innovative|related to|about)\b|^(is|are|has|have|good|best|great|quality|innovative)$/i;

const VAGUE_OBJECT =
  /^(users?|people|everyone|blockchain|web3|early adopters?|quality|trust|intuition protocol)$/i;

function shortenPhrase(text: string, max = 48): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trim() + "…";
}

function isBountyPredicate(predicate: string): boolean {
  return predicate.trim().toLowerCase() === BOUNTY_PREDICATE_LABEL.toLowerCase();
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

function briefSnippet(text: string | undefined, max = 48): string | null {
  if (!text?.trim() || isPlaceholderBriefText(text) || isIntentLikeLabel(text)) {
    return null;
  }
  const sentence = text.split(/[.!?]/)[0]?.trim();
  if (!sentence || sentence.length < 8) return null;
  return shortenPhrase(sentence, max);
}

function buildSupportFromBrief(
  title: string,
  brief: IdeaBrief | undefined,
  popularPredicates: Array<{ label: string }>,
): TripleLine[] {
  if (!brief) return [];

  const lines: TripleLine[] = [];

  const target = briefSnippet(brief.targetUsers, 40);
  if (target) {
    lines.push({
      subject: title,
      predicate: pickPredicate(["targets", "built for", "for"], popularPredicates),
      object: target,
      rationale: "Target segment from product brief.",
      kind: "support",
      recommended: true,
    });
  }

  const problem =
    briefSnippet(brief.problem, 50) ??
    briefSnippet(brief.solution, 50) ??
    briefSnippet(brief.oneLiner, 50);
  if (problem) {
    lines.push({
      subject: title,
      predicate: pickPredicate(["solves", "addresses", "fixes"], popularPredicates),
      object: problem,
      rationale: "Problem or product promise from brief.",
      kind: "support",
      recommended: true,
    });
  }

  const mechanism = briefSnippet(brief.trustMechanism, 50);
  if (mechanism) {
    lines.push({
      subject: title,
      predicate: pickPredicate(["uses", "relies on", "has feature"], popularPredicates),
      object: mechanism,
      rationale: "Trust mechanism from product brief.",
      kind: "support",
      recommended: true,
    });
  }

  const mvp = briefSnippet(brief.mvpScope, 45);
  if (mvp && lines.length < 3) {
    lines.push({
      subject: title,
      predicate: pickPredicate(["has feature", "includes", "offers"], popularPredicates),
      object: mvp,
      rationale: "MVP scope from product brief.",
      kind: "support",
      recommended: true,
    });
  }

  return lines.slice(0, 3);
}

function isValidSupportLine(line: TripleLine, title: string): boolean {
  const subject = line.subject.trim();
  const object = line.object.trim();
  const predicate = line.predicate.trim();

  if (subject.toLowerCase() !== title.toLowerCase()) return false;
  if (isBountyPredicate(predicate)) return false;
  if (predicate.toLowerCase() === INTUITION_PROTOCOL_OBJECT_LABEL.toLowerCase()) return false;
  if (object.toLowerCase() === INTUITION_PROTOCOL_OBJECT_LABEL.toLowerCase()) return false;
  if (VAGUE_PREDICATE.test(predicate)) return false;
  if (VAGUE_OBJECT.test(object)) return false;
  if (isIntentLikeLabel(object) || isIntentLikeLabel(subject)) return false;
  if (isPlaceholderBriefText(object)) return false;
  if (object.length > 60 || predicate.length > 35) return false;
  if (predicate.split(/\s+/).length > 4) return false;
  return true;
}

export function refineTripleDraft(
  draft: TripleDraft,
  options: {
    ideaTitle: string;
    ideaBrief?: IdeaBrief;
    rawIntent?: string;
    popularPredicates?: Array<{ label: string }>;
    coreAlreadyExists?: boolean;
  },
): TripleDraft {
  const title = deriveAtomLabel({
    title: options.ideaBrief?.title,
    oneLiner: options.ideaBrief?.oneLiner,
    rawIntent: options.rawIntent,
    fallback: options.ideaTitle,
  });
  const popular = options.popularPredicates ?? [];

  const core = defaultCoreTriple(title);
  if (options.coreAlreadyExists) {
    core.rationale =
      "Standard ecosystem bounty triple — may already exist on-chain; documented in PR.";
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
    .map((t) => ({ ...t, subject: title, kind: "nested" as const, recommended: false }));

  const notes = [...(draft.protocolNotes ?? [])];
  if (!notes.some((n) => n.includes("Intuition Protocol"))) {
    notes.push(
      `Required core triple: [${title}] → ${BOUNTY_PREDICATE_LABEL} → ${INTUITION_PROTOCOL_OBJECT_LABEL}.`,
    );
  }

  const pitch =
    options.ideaBrief?.oneLiner?.trim() ||
    draft.refinedPitch?.trim() ||
    options.ideaBrief?.solution?.trim()?.slice(0, 200) ||
    "";

  return {
    ...draft,
    ideaTitle: title,
    refinedPitch: pitch.length >= 40 ? pitch : pitch || draft.refinedPitch,
    coreTriple: core,
    supportTriples: support,
    nestedTriples: nested,
    protocolNotes: notes.slice(0, 6),
  };
}
