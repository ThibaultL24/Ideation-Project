// src/lib/assist/schemas.ts
import { z } from "zod";

const tripleLineSchema = z.object({
  subject: z.string(),
  predicate: z.string(),
  object: z.string(),
  rationale: z.string(),
  kind: z.enum(["core", "support", "nested"]),
  recommended: z.boolean(),
});

export const assistTripleResponseSchema = z.object({
  ideaTitle: z.string(),
  refinedPitch: z.string(),
  archetypeSummary: z.string(),
  coreTriple: tripleLineSchema,
  supportTriples: z.array(tripleLineSchema).max(5),
  nestedTriples: z.array(tripleLineSchema).max(3),
  protocolNotes: z.array(z.string()).max(6),
});

export type AssistTripleResponse = z.infer<typeof assistTripleResponseSchema>;

export const assistSynthesisResponseSchema = z.object({
  title: z.string(),
  oneLiner: z.string(),
  problem: z.string(),
  solution: z.string(),
  targetUsers: z.string(),
  whyNow: z.string(),
  intuitionAngle: z.string(),
  trustMechanism: z.string().optional().default(""),
  mvpScope: z.string(),
  openQuestions: z.union([z.string(), z.array(z.string())]),
});

export type AssistSynthesisResponse = z.infer<typeof assistSynthesisResponseSchema>;
