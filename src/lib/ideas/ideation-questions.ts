// src/lib/ideas/ideation-questions.ts

export interface IdeationQuestion {
  id: string;
  text: string;
  placeholder: string;
  optional?: boolean;
}

export const IDEATION_QUESTIONS: IdeationQuestion[] = [
  {
    id: "intuition_why",
    text: "Why does Intuition matter here? Why do atoms, triples, or signal count?",
    placeholder:
      "E.g. people could stake on the quality of a historical interpretation or an AI agent's performance…",
  },
  {
    id: "key_feature",
    text: "What is the most important feature, in your view?",
    placeholder: "E.g. map with life paths, community voting, conviction-based ranking…",
  },
  {
    id: "inspirations",
    text: "What are your inspirations for this idea?",
    placeholder: "Products, readings, experiences, historical theories, other dapps…",
  },
  {
    id: "users",
    text: "Who would use this product first?",
    placeholder: "Be specific: students, curators, agent developers, tourists…",
  },
  {
    id: "perspectives",
    text: "An angle or perspective to explore? (optional)",
    placeholder: "E.g. educational version, B2B museums, historical controversy as a feature…",
    optional: true,
  },
];
