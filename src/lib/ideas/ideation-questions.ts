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
    text: "Quel est l'intérêt pour Intuition ? Pourquoi atoms, triples ou le signal comptent ici ?",
    placeholder:
      "Ex. : les gens pourraient staker sur la qualité d'une interprétation historique ou la performance d'un agent IA…",
  },
  {
    id: "key_feature",
    text: "Quelle est la feature la plus importante selon toi ?",
    placeholder: "Ex. : carte avec tracés de vie, vote communautaire, classement par conviction…",
  },
  {
    id: "inspirations",
    text: "Quelles sont tes inspirations pour cette idée ?",
    placeholder: "Produits, lectures, expériences, théories historiques, autres dapps…",
  },
  {
    id: "users",
    text: "Qui utiliserait ce produit en premier ?",
    placeholder: "Sois précis : étudiants, curateurs, développeurs d'agents, touristes…",
  },
  {
    id: "perspectives",
    text: "Un angle ou une perspective à explorer ? (optionnel)",
    placeholder: "Ex. : version éducative, B2B musées, controverse historique comme feature…",
    optional: true,
  },
];
