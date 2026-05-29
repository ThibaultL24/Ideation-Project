// src/lib/ideas/pick-refinement.ts
import type { Idea } from "./schema";
import { buildIdeaFullState, type IdeaFullState } from "./idea-state";
import { loadNormalizedIdeas } from "./load";

const STOP_WORDS = new Set([
  "je",
  "veux",
  "créer",
  "creer",
  "une",
  "un",
  "des",
  "du",
  "de",
  "la",
  "le",
  "les",
  "sur",
  "pour",
  "avec",
  "app",
  "application",
  "dapp",
  "the",
  "a",
  "an",
  "to",
  "for",
  "on",
  "and",
  "or",
  "i",
  "want",
  "build",
  "make",
]);

export interface PickChoice {
  id: string;
  label: string;
  hint?: string;
}

export interface PickQuestion {
  id: string;
  text: string;
  choices: PickChoice[];
}

export interface PickAnswer {
  questionId: string;
  choiceId: string;
}

export interface PickFilters {
  categories: string[];
  archetype?: string;
  keywords: string[];
  focusSlug?: string;
  excludeSlugs: string[];
}

export interface PickRefineRequest {
  intent: string;
  answers: PickAnswer[];
  excludeSlugs?: string[];
  focusSlug?: string;
}

export interface PickRefineResponse {
  step: number;
  matchCount: number;
  filters: PickFilters;
  filtersSummary: string[];
  question: PickQuestion | null;
  cards: IdeaFullState[];
  readyToSelect: boolean;
}

const ARCHETYPES: Record<
  string,
  { label: string; hint: string; categories: string[]; keywords: string[] }
> = {
  curation: {
    label: "Listes & curation",
    hint: "Découvrir, classer, recommander",
    categories: ["Marketplaces & Discovery", "Knowledge, Research & Information"],
    keywords: ["curat", "discover", "list", "rank", "marketplace"],
  },
  reputation: {
    label: "Réputation & avis",
    hint: "Confiance, reviews, scores",
    categories: ["Reviews & Ratings", "Identity, Reputation & Credentials"],
    keywords: ["review", "reputation", "trust", "rating", "score", "stake"],
  },
  social: {
    label: "Social & communauté",
    hint: "Attestations entre pairs",
    categories: ["Social Networks & Community"],
    keywords: ["social", "community", "network", "friend"],
  },
  agents: {
    label: "IA & agents",
    hint: "Agents, ML, intelligence",
    categories: ["AI Agents & Machine Intelligence"],
    keywords: ["ai", "agent", "ml", "machine", "intelligence", "llm", "model", "bot"],
  },
  safety: {
    label: "Sécurité & fraude",
    hint: "Détection, protection, vérification",
    categories: ["Safety, Security & Protection"],
    keywords: ["fraud", "scam", "security", "safety", "verify", "detect"],
  },
  signals: {
    label: "Signaux & prédiction",
    hint: "Marchés, forecasting",
    categories: ["Prediction & Signal Markets", "Finance, DeFi & Insurance"],
    keywords: ["predict", "signal", "market", "forecast", "defi"],
  },
};

const DOMAIN_HINTS: Record<string, { keywords: string[]; categories: string[] }> =
  {
    ai: {
      keywords: ["ai", "agent", "ml", "intelligence", "llm", "model", "gpt"],
      categories: ["AI Agents & Machine Intelligence"],
    },
    finance: {
      keywords: ["defi", "finance", "insurance", "token", "payment"],
      categories: ["Finance, DeFi & Insurance"],
    },
    health: {
      keywords: ["health", "medical", "wellness", "doctor", "patient"],
      categories: ["Healthcare & Wellness"],
    },
    education: {
      keywords: ["learn", "education", "course", "student", "teacher"],
      categories: ["Education & Learning"],
    },
    identity: {
      keywords: ["identity", "credential", "reputation", "kyc", "verify"],
      categories: ["Identity, Reputation & Credentials"],
    },
  };

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function ideaSearchText(idea: Idea): string {
  return [
    idea.title,
    idea.tagline,
    idea.description,
    idea.category,
    idea.comparable ?? "",
    ...idea.tags,
  ]
    .join(" ")
    .toLowerCase();
}

function scoreIdea(idea: Idea, tokens: string[], filters: PickFilters): number {
  if (filters.excludeSlugs.includes(idea.slug)) return -1;

  const text = ideaSearchText(idea);
  let score = 0;

  for (const token of tokens) {
    if (text.includes(token)) score += 3;
  }

  for (const kw of filters.keywords) {
    if (text.includes(kw)) score += 2;
  }

  if (filters.categories.length > 0 && filters.categories.includes(idea.category)) {
    score += 8;
  }

  if (filters.focusSlug) {
    const focus = loadNormalizedIdeas().find((i) => i.slug === filters.focusSlug);
    if (focus) {
      if (idea.category === focus.category) score += 6;
      const sharedTags = idea.tags.filter((t) => focus.tags.includes(t));
      score += sharedTags.length * 2;
      if (idea.slug === filters.focusSlug) score += 20;
    }
  }

  return score;
}

function buildFiltersFromAnswers(
  intent: string,
  answers: PickAnswer[],
  excludeSlugs: string[],
  focusSlug?: string,
): PickFilters {
  const tokens = tokenize(intent);
  const categories = new Set<string>();
  const keywords = new Set<string>(tokens);
  let archetype: string | undefined;

  for (const domain of Object.values(DOMAIN_HINTS)) {
    if (tokens.some((t) => domain.keywords.includes(t))) {
      domain.categories.forEach((c) => categories.add(c));
      domain.keywords.forEach((k) => keywords.add(k));
    }
  }

  for (const answer of answers) {
    if (answer.questionId === "domain" && answer.choiceId.startsWith("cat:")) {
      categories.add(answer.choiceId.slice(4));
    }
    if (answer.questionId === "archetype" && ARCHETYPES[answer.choiceId]) {
      archetype = answer.choiceId;
      const arch = ARCHETYPES[answer.choiceId];
      arch.categories.forEach((c) => categories.add(c));
      arch.keywords.forEach((k) => keywords.add(k));
    }
    if (answer.questionId === "focus_path") {
      if (answer.choiceId === "narrow" && focusSlug) {
        /* focus already set */
      }
      if (answer.choiceId === "widen") {
        categories.clear();
      }
    }
    if (answer.questionId === "card_fit" && answer.choiceId === "not_this") {
      if (focusSlug) excludeSlugs.push(focusSlug);
    }
  }

  return {
    categories: [...categories],
    archetype,
    keywords: [...keywords],
    focusSlug,
    excludeSlugs: [...new Set(excludeSlugs)],
  };
}

function rankIdeas(ideas: Idea[], filters: PickFilters, intent: string): Idea[] {
  const tokens = tokenize(intent);
  return [...ideas]
    .map((idea) => ({ idea, score: scoreIdea(idea, tokens, filters) }))
    .filter((row) => row.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.idea);
}

function topCategories(ranked: Idea[], limit = 4): string[] {
  const counts = new Map<string, number>();
  for (const idea of ranked.slice(0, 40)) {
    counts.set(idea.category, (counts.get(idea.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([cat]) => cat);
}

function nextQuestion(
  intent: string,
  answers: PickAnswer[],
  ranked: Idea[],
  focusSlug?: string,
): PickQuestion | null {
  const answered = new Set(answers.map((a) => a.questionId));

  if (!answered.has("archetype") && ranked.length > 5) {
    const suggested = Object.entries(ARCHETYPES)
      .filter(([, arch]) =>
        ranked.slice(0, 30).some((idea) =>
          arch.categories.includes(idea.category),
        ),
      )
      .slice(0, 4);

    const choices: PickChoice[] =
      suggested.length > 0
        ? suggested.map(([id, arch]) => ({
            id,
            label: arch.label,
            hint: arch.hint,
          }))
        : Object.entries(ARCHETYPES).slice(0, 4).map(([id, arch]) => ({
            id,
            label: arch.label,
            hint: arch.hint,
          }));

    choices.push({
      id: "any",
      label: "Tout domaine",
      hint: "Ne pas filtrer par archétype",
    });

    return {
      id: "archetype",
      text: `Pour « ${intent.slice(0, 80)}${intent.length > 80 ? "…" : ""} », quel type de produit Intuition envisagez-vous ?`,
      choices,
    };
  }

  if (!answered.has("domain") && ranked.length > 15) {
    const cats = topCategories(ranked);
    if (cats.length >= 2) {
      return {
        id: "domain",
        text: "Quel secteur du catalogue se rapproche le plus de votre idée ?",
        choices: [
          ...cats.map((cat) => ({
            id: `cat:${cat}`,
            label: cat,
          })),
          {
            id: "cat:any",
            label: "Plusieurs secteurs",
            hint: "Garder toutes les pistes",
          },
        ],
      };
    }
  }

  if (focusSlug && !answered.has("focus_path")) {
    const focus = loadNormalizedIdeas().find((i) => i.slug === focusSlug);
    return {
      id: "focus_path",
      text: focus
        ? `« ${focus.title} » vous inspire — on affine dans cette direction ?`
        : "Affiner autour de cette carte ?",
      choices: [
        {
          id: "narrow",
          label: "Oui, des idées plus proches",
          hint: "Cartes plus précises dans le même espace",
        },
        {
          id: "widen",
          label: "Non, élargir la recherche",
          hint: "Autres catégories",
        },
      ],
    };
  }

  if (focusSlug && !answered.has("card_fit")) {
    return {
      id: "card_fit",
      text: "Cette carte correspond-elle à ce que vous voulez construire ?",
      choices: [
        {
          id: "yes",
          label: "Oui, partir de là",
          hint: "Brainstorm & prepare ensuite",
        },
        {
          id: "not_this",
          label: "Pas vraiment",
          hint: "Proposer d'autres cartes",
        },
      ],
    };
  }

  return null;
}

function filtersSummary(filters: PickFilters): string[] {
  const lines: string[] = [];
  if (filters.archetype && ARCHETYPES[filters.archetype]) {
    lines.push(`Archétype : ${ARCHETYPES[filters.archetype].label}`);
  }
  if (filters.categories.length > 0) {
    lines.push(`Secteurs : ${filters.categories.join(" · ")}`);
  }
  if (filters.focusSlug) {
    lines.push(`Focus : ${filters.focusSlug}`);
  }
  if (filters.excludeSlugs.length > 0) {
    lines.push(`${filters.excludeSlugs.length} carte(s) écartée(s)`);
  }
  return lines;
}

export async function refinePick(
  request: PickRefineRequest,
): Promise<PickRefineResponse> {
  const intent = request.intent.trim();
  const answers = request.answers ?? [];
  const excludeSlugs = [...(request.excludeSlugs ?? [])];
  let focusSlug = request.focusSlug;

  const lastCardAnswer = [...answers]
    .reverse()
    .find((a) => a.questionId === "pick_card");
  if (lastCardAnswer && !focusSlug) {
    focusSlug = lastCardAnswer.choiceId;
  }

  if (answers.some((a) => a.questionId === "card_fit" && a.choiceId === "not_this")) {
    if (focusSlug) excludeSlugs.push(focusSlug);
    focusSlug = undefined;
  }

  const filters = buildFiltersFromAnswers(intent, answers, excludeSlugs, focusSlug);
  const all = loadNormalizedIdeas();
  const ranked = rankIdeas(all, filters, intent);
  const matchCount = ranked.length;

  const question = intent.length < 3 ? null : nextQuestion(intent, answers, ranked, focusSlug);

  const cardCount = question ? 4 : 6;
  const top = ranked.slice(0, cardCount);
  const cards = await Promise.all(
    top.map((idea) => buildIdeaFullState(idea, { verifyOnchain: false })),
  );

  const readyToSelect =
    !question &&
    cards.length > 0 &&
    (answers.some((a) => a.questionId === "card_fit" && a.choiceId === "yes") ||
      (matchCount <= 8 && answers.length >= 1) ||
      Boolean(focusSlug && answers.length >= 2));

  return {
    step: answers.length + 1,
    matchCount,
    filters,
    filtersSummary: filtersSummary(filters),
    question: readyToSelect ? null : question,
    cards,
    readyToSelect,
  };
}

export function pickCardChoiceQuestion(): PickQuestion {
  return {
    id: "pick_card",
    text: "Choisissez la carte la plus proche de votre projet :",
    choices: [],
  };
}
