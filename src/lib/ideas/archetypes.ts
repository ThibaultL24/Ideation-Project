// src/lib/ideas/archetypes.ts
/** Archétypes Intuition alignés sur les tutoriels officiels (PDF brainstorm UI). */

export interface IntuitionArchetype {
  id: string;
  label: string;
  hint: string;
  pdfPattern: string;
  categories: string[];
  keywords: string[];
}

export const INTUITION_ARCHETYPES: Record<string, IntuitionArchetype> = {
  curation: {
    id: "curation",
    label: "Liste curée",
    hint: "Découvrir, classer, recommander",
    pdfPattern: "curated lists",
    categories: ["Marketplaces & Discovery", "Knowledge, Research & Information"],
    keywords: ["curat", "discover", "list", "rank", "marketplace"],
  },
  reputation: {
    id: "reputation",
    label: "Réputation",
    hint: "Scores, avis, confiance",
    pdfPattern: "reputation system",
    categories: ["Reviews & Ratings", "Identity, Reputation & Credentials"],
    keywords: ["review", "reputation", "trust", "rating", "score", "stake"],
  },
  social: {
    id: "social",
    label: "Attestations sociales",
    hint: "Graphe social, pairs",
    pdfPattern: "social attestations",
    categories: ["Social Networks & Community"],
    keywords: ["social", "community", "network", "friend", "attest"],
  },
  safety: {
    id: "safety",
    label: "Détection / alerte",
    hint: "Fraude, contestation, disputes",
    pdfPattern: "fraud detection",
    categories: ["Safety, Security & Protection"],
    keywords: ["fraud", "scam", "security", "safety", "verify", "detect"],
  },
  signals: {
    id: "signals",
    label: "Prédiction / confidence",
    hint: "Signaux, marchés, forecasting",
    pdfPattern: "prediction market",
    categories: ["Prediction & Signal Markets", "Finance, DeFi & Insurance"],
    keywords: ["predict", "signal", "market", "forecast", "defi", "confidence"],
  },
};

export const ARCHETYPE_LIST = Object.values(INTUITION_ARCHETYPES);
