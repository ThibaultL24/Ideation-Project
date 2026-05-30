// src/lib/workshop/card-tree.ts
/** Arbre de cartes type « Wabbojack » : 4 choix par niveau, jusqu'à 3 niveaux. */

export interface WorkshopCard {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
}

export interface CardLevel {
  id: string;
  question: string;
  cards: WorkshopCard[];
}

export interface CardPick {
  levelId: string;
  cardId: string;
  title: string;
}

const ROOT: CardLevel = {
  id: "root",
  question: "Quel modèle de produit te parle le plus ?",
  cards: [
    {
      id: "reputation",
      title: "Réputation",
      subtitle: "Scores, avis, confiance entre pairs",
      tags: ["trust", "reviews", "rating"],
    },
    {
      id: "curation",
      title: "Liste curée",
      subtitle: "Découvrir, classer, recommander",
      tags: ["discover", "rank", "list"],
    },
    {
      id: "attestation",
      title: "Attestations",
      subtitle: "Preuves vérifiables sur des faits",
      tags: ["claim", "verify", "proof"],
    },
    {
      id: "signal",
      title: "Signal & marchés",
      subtitle: "Conviction économique, prédiction",
      tags: ["stake", "market", "prediction"],
    },
  ],
};

const LEVEL2: Record<string, CardLevel> = {
  reputation: {
    id: "reputation-focus",
    question: "Qui ou quoi est évalué ?",
    cards: [
      { id: "people", title: "Personnes", subtitle: "Pros, créateurs, prestataires", tags: ["people"] },
      { id: "orgs", title: "Organisations", subtitle: "Entreprises, DAOs, institutions", tags: ["org"] },
      { id: "products", title: "Produits & services", subtitle: "Apps, outils, offres", tags: ["product"] },
      { id: "content", title: "Contenu", subtitle: "Articles, médias, recherches", tags: ["content"] },
    ],
  },
  curation: {
    id: "curation-focus",
    question: "Que curates-tu exactement ?",
    cards: [
      { id: "tools", title: "Outils & ressources", subtitle: "Stack, APIs, templates", tags: ["tools"] },
      { id: "opportunities", title: "Opportunités", subtitle: "Jobs, grants, deals", tags: ["jobs"] },
      { id: "knowledge", title: "Savoir", subtitle: "Concepts, tutoriels, FAQs", tags: ["knowledge"] },
      { id: "communities", title: "Communautés", subtitle: "Groupes, événements, niches", tags: ["community"] },
    ],
  },
  attestation: {
    id: "attestation-focus",
    question: "Quel type de claim veux-tu attester ?",
    cards: [
      { id: "identity", title: "Identité & credentials", subtitle: "Diplômes, rôles, affiliations", tags: ["identity"] },
      { id: "events", title: "Événements", subtitle: "Ce qui s'est passé, quand, où", tags: ["events"] },
      { id: "quality", title: "Qualité & conformité", subtitle: "Standards, audits, certifications", tags: ["quality"] },
      { id: "relationships", title: "Relations", subtitle: "Liens entre entités du graphe", tags: ["graph"] },
    ],
  },
  signal: {
    id: "signal-focus",
    question: "Sur quoi porte la conviction économique ?",
    cards: [
      { id: "forecasts", title: "Prévisions", subtitle: "Futur, probabilités, scénarios", tags: ["forecast"] },
      { id: "risk", title: "Risque & fraude", subtitle: "Alertes, scoring de menace", tags: ["risk"] },
      { id: "quality-signal", title: "Qualité de donnée", subtitle: "Fiabilité d'une source", tags: ["data"] },
      { id: "agents", title: "Agents IA", subtitle: "Mémoire, contexte, outils", tags: ["ai", "agent"] },
    ],
  },
};

const LEVEL3: Record<string, CardLevel> = {
  people: {
    id: "people-mechanism",
    question: "Quel mécanisme Intuition est central ?",
    cards: [
      { id: "stake-reviews", title: "Avis stakés", subtitle: "Pour/contre avec $TRUST", tags: ["stake"] },
      { id: "portable-rep", title: "Réputation portable", subtitle: "Graphe qui voyage entre apps", tags: ["portable"] },
      { id: "expert-curate", title: "Curateurs experts", subtitle: "Poids des signaux forts", tags: ["expert"] },
      { id: "dispute", title: "Contestabilité", subtitle: "Counter-claims et preuves", tags: ["dispute"] },
    ],
  },
  tools: {
    id: "tools-mechanism",
    question: "Comment les utilisateurs interagissent ?",
    cards: [
      { id: "rank-stake", title: "Classement staké", subtitle: "Ordre = conviction agrégée", tags: ["rank"] },
      { id: "tag-graph", title: "Tags graphe", subtitle: "Atoms liés par triples", tags: ["tags"] },
      { id: "personal-lists", title: "Listes personnelles", subtitle: "Curation + partage onchain", tags: ["lists"] },
      { id: "dao-vote", title: "Gouvernance légère", subtitle: "Votes sur entrées de liste", tags: ["dao"] },
    ],
  },
  identity: {
    id: "identity-mechanism",
    question: "Quelle preuve est la plus difficile à falsifier ?",
    cards: [
      { id: "issuer-stake", title: "Émetteur staké", subtitle: "L'émetteur mise sa réputation", tags: ["issuer"] },
      { id: "multi-attest", title: "Multi-attestation", subtitle: "Plusieurs sources indépendantes", tags: ["multi"] },
      { id: "time-bound", title: "Validité temporelle", subtitle: "Claims avec expiration", tags: ["time"] },
      { id: "nested-prov", title: "Provenance imbriquée", subtitle: "Triple dans triple (avancé)", tags: ["nested"] },
    ],
  },
  agents: {
    id: "agents-mechanism",
    question: "Quel problème l'agent résout-il ?",
    cards: [
      { id: "memory", title: "Mémoire vérifiable", subtitle: "Faits sourcés pour le LLM", tags: ["memory"] },
      { id: "tool-trust", title: "Confiance outils", subtitle: "Quels APIs/plugins utiliser", tags: ["tools"] },
      { id: "user-prefs", title: "Préférences utilisateur", subtitle: "Graphe de goûts portable", tags: ["prefs"] },
      { id: "agent-rep", title: "Réputation d'agents", subtitle: "Agents notés par la communauté", tags: ["rep"] },
    ],
  },
};

/** Niveaux sans entrée LEVEL3 dédiée : fallback générique. */
const GENERIC_LEVEL3: CardLevel = {
  id: "generic-mechanism",
  question: "Comment Intuition renforce ton idée ?",
  cards: [
    { id: "core-triple", title: "Triple cœur", subtitle: "Idée → top project ideas for → Intuition", tags: ["core"] },
    { id: "support-triples", title: "Triples de soutien", subtitle: "Relations ciblées (targets, uses…)", tags: ["support"] },
    { id: "stake-signal", title: "Signal économique", subtitle: "Stake pour montrer la conviction", tags: ["stake"] },
    { id: "discovery", title: "Découverte graphe", subtitle: "Trouvable via Portal / GraphQL", tags: ["discovery"] },
  ],
};

export const MAX_CARD_DEPTH = 3;

export function getLevelAfterPicks(picks: CardPick[]): CardLevel | null {
  if (picks.length === 0) return ROOT;
  if (picks.length === 1) {
    const archetype = picks[0]?.cardId;
    return LEVEL2[archetype] ?? null;
  }
  if (picks.length === 2) {
    const focus = picks[1]?.cardId;
    return LEVEL3[focus] ?? GENERIC_LEVEL3;
  }
  return null;
}

export function isRefinementComplete(picks: CardPick[]): boolean {
  return picks.length >= MAX_CARD_DEPTH;
}

export function buildRefinementSummary(
  rawIntent: string,
  picks: CardPick[],
): string {
  const path = picks.map((p) => p.title).join(" → ");
  const intent = rawIntent.trim();
  if (!path) return intent;
  if (!intent) return `Modèle choisi : ${path}`;
  return `${intent}\n\nModèle choisi : ${path}`;
}

export function scoreCatalogIdeas(
  intent: string,
  picks: CardPick[],
): string[] {
  const haystack = `${intent} ${picks.flatMap((p) => p.title).join(" ")}`.toLowerCase();
  const keywords = picks.flatMap((p) => p.title.split(/\s+/));
  return keywords.filter((k) => k.length > 3 && haystack.includes(k.toLowerCase()));
}
