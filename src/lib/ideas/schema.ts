// src/lib/ideas/schema.ts
import { z } from "zod";

export const ideaStatusSchema = z.enum([
  "draft",
  "normalized",
  "github_ready",
  "github_published",
  "ipfs_pinned",
  "atom_created",
  "triples_created",
  "verified",
  "published",
  "onchain",
]);

export type IdeaStatus = z.infer<typeof ideaStatusSchema>;

export const ideaGithubSchema = z.object({
  path: z.string().optional(),
  prUrl: z.string().url().optional(),
  blobUrl: z.string().url().optional(),
  commitSha: z.string().optional(),
});

export const ideaIpfsSchema = z.object({
  uri: z.string().optional(),
  cid: z.string().optional(),
});

export const ideaIntuitionSchema = z.object({
  atomId: z.string().optional(),
  triples: z.array(z.string()).optional(),
  txHash: z.string().optional(),
});

export const ideaSchema = z.object({
  canonicalId: z.string(),
  slug: z.string(),
  title: z.string(),
  tagline: z.string(),
  category: z.string(),
  categoryIndex: z.number().int().positive(),
  ideaIndex: z.number().int().positive(),
  description: z.string(),
  comparable: z.string().optional(),
  tags: z.array(z.string()),
  status: ideaStatusSchema,
  github: ideaGithubSchema.optional(),
  ipfs: ideaIpfsSchema.optional(),
  intuition: ideaIntuitionSchema.optional(),
});

export type Idea = z.infer<typeof ideaSchema>;

export const ipfsIdeaMetadataSchema = z.object({
  schemaVersion: z.literal("1.0"),
  canonicalId: z.string(),
  slug: z.string(),
  title: z.string(),
  tagline: z.string(),
  category: z.string(),
  description: z.string(),
  comparable: z.string().optional(),
  tags: z.array(z.string()),
  source: z.literal("build-on-intuition-300-ideas"),
  githubPath: z.string().optional(),
});

export type IpfsIdeaMetadata = z.infer<typeof ipfsIdeaMetadataSchema>;

export const migrationReportSchema = z.object({
  totalIdeas: z.number(),
  normalized: z.number(),
  duplicatesRemoved: z.number(),
  githubMarkdownGenerated: z.number(),
  ipfsJsonGenerated: z.number(),
  byCategory: z.record(z.string(), z.number()),
  failed: z.array(
    z.object({
      title: z.string(),
      reason: z.string(),
    }),
  ),
  network: z.string().optional(),
  generatedAt: z.string(),
});

export type MigrationReport = z.infer<typeof migrationReportSchema>;
