// src/lib/ideas/idea-reflection.ts
import type { BrainstormArchetype } from "./publish-plan";

export interface IdeaReflectionReport {
  headline: string;
  reflection: string;
  strengths: string[];
  weaknesses: string[];
  problem: string;
  solution: string;
  users: string;
  intuitionFit: string;
  mvp: string;
  risks: string[];
  challenge: string;
  archetype: BrainstormArchetype;
  ecosystemNote: string;
  generatedAt: string;
}
