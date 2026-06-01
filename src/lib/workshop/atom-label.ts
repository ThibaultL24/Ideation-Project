// src/lib/workshop/atom-label.ts
/** Label court pour l'atom / sujet des triples — jamais la phrase brute de l'utilisateur. */

const INTENT_PREFIX =
  /^(j'aimerais|j aimerais|je voudrais|je veux|i would like|i want to)\b/i;

const PLACEHOLDER =
  /^(early adopters?|à préciser|a preciser|new idea|nouvelle idée|untitled|tbd)\b/i;

export function isIntentLikeLabel(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (INTENT_PREFIX.test(t)) return true;
  if (t.length > 52) return true;
  if (/[.!?]/.test(t)) return true;
  if (t.split(/\s+/).length > 7) return true;
  return false;
}

export function isPlaceholderBriefText(text: string | undefined): boolean {
  if (!text?.trim()) return true;
  const t = text.trim();
  if (PLACEHOLDER.test(t)) return true;
  if (/à définir|a definir|to be defined|configure openai/i.test(t)) return true;
  return false;
}

function titleCasePhrase(phrase: string): string {
  return phrase
    .split(/\s+/)
    .map((w) => {
      const lower = w.toLowerCase();
      if (lower === "gps" || lower === "api" || lower === "b2b" || lower === "mvp") {
        return lower.toUpperCase();
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

function stripIntentPrefix(text: string): string {
  return text
    .replace(
      /^(j'aimerais|j aimerais|je voudrais|je veux|i want to|i would like to)\s+(créer|creer|faire|build|create|developper|développer)\s+(une?|un|la|le|des?)?\s*/i,
      "",
    )
    .trim();
}

function clipClause(text: string): string {
  return text
    .replace(/\s+qui\s+.*/i, "")
    .replace(/\s+que\s+.*/i, "")
    .replace(/\s+afin\s+.*/i, "")
    .trim();
}

function extractProductPhrase(text: string): string | null {
  const stripped = stripIntentPrefix(text);
  const segments = stripped
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const ordered = segments.length > 1 ? [...segments].reverse() : segments;

  for (const segment of ordered) {
    let phrase = clipClause(segment);
    phrase = phrase.replace(/^(une?|un|la|le|des?)\s+/i, "").trim();
    if (phrase.length >= 3 && phrase.length <= 48 && phrase.split(/\s+/).length <= 6) {
      if (!isIntentLikeLabel(phrase)) return titleCasePhrase(phrase);
    }
  }

  const cinemaMatch = stripped.match(
    /\b(?:cinema|cinelma|cinem[aà])\s*([a-zàâäéèêëïîôùûüç0-9\s-]{0,30})?/i,
  );
  if (cinemaMatch) {
    const extra = cinemaMatch[1]?.trim();
    if (extra && extra.length >= 3 && extra.length <= 24) {
      return titleCasePhrase(`Cinema ${extra}`);
    }
    return "Cinema Culture App";
  }

  const appMatch = stripped.match(
    /\b(?:application|app|plateforme|outil|service)\s+(?:de\s+|d[''])?([a-zàâäéèêëïîôùûüç0-9\s-]{3,40})/i,
  );
  if (appMatch?.[1]) {
    const phrase = clipClause(appMatch[1].trim());
    if (phrase.length >= 3 && phrase.length <= 48) return titleCasePhrase(phrase);
  }

  return null;
}

export function deriveAtomLabel(input: {
  title?: string;
  oneLiner?: string;
  rawIntent?: string;
  fallback?: string;
}): string {
  const candidates = [
    input.title?.trim(),
    input.oneLiner?.trim(),
    extractProductPhrase(input.rawIntent ?? ""),
    extractProductPhrase(input.oneLiner ?? ""),
  ];

  for (const c of candidates) {
    if (c && !isIntentLikeLabel(c) && !isPlaceholderBriefText(c)) {
      return c.length > 48 ? c.slice(0, 47).trim() + "…" : c;
    }
  }

  const fromIntent = extractProductPhrase(input.rawIntent ?? "");
  if (fromIntent) return fromIntent;

  return input.fallback?.trim() || "New idea";
}

export function resolveWorkshopAtomLabel(input: {
  rawIntent?: string;
  catalogTitle?: string;
  ideaBrief?: { title?: string; oneLiner?: string };
}): string {
  return deriveAtomLabel({
    title: input.ideaBrief?.title,
    oneLiner: input.ideaBrief?.oneLiner,
    rawIntent: input.rawIntent,
    fallback: input.catalogTitle,
  });
}
