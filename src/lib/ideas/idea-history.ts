// src/lib/ideas/idea-history.ts
import { z } from "zod";
import type { BrainstormDraft } from "./publish-plan";
import { normalizeBrainstormDraft } from "./publish-plan";
import {
  createVersionId,
  ideationActionResultSchema,
  ideaVersionSchema,
  type IdeationActionResult,
  type IdeaVersion,
  type IdeaVersionOrigin,
} from "./ideation-actions";

export const HISTORY_STORAGE_VERSION = 1 as const;

const historyEnvelopeSchema = z.object({
  storageVersion: z.literal(1),
  ideaId: z.string().min(1),
  currentVersion: z.number().int().nonnegative(),
  results: z.array(ideationActionResultSchema),
  versions: z.array(ideaVersionSchema),
});

export type IdeaHistory = z.infer<typeof historyEnvelopeSchema>;

export interface IdeaHistoryRepository {
  loadIdeaHistory(ideaId: string): Promise<IdeaHistory | null>;
  saveResult(result: IdeationActionResult): Promise<void>;
  saveVersion(version: IdeaVersion): Promise<void>;
  markResultStatus(resultId: string, status: "accepted" | "rejected"): Promise<void>;
  replaceHistory(history: IdeaHistory): Promise<void>;
}

export function historyStorageKey(ideaId: string): string {
  return `brainstorm-history:${ideaId}`;
}

export function emptyIdeaHistory(ideaId: string): IdeaHistory {
  return {
    storageVersion: HISTORY_STORAGE_VERSION,
    ideaId,
    currentVersion: 0,
    results: [],
    versions: [],
  };
}

export function parseIdeaHistory(raw: unknown): IdeaHistory | null {
  const parsed = historyEnvelopeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function readRaw(ideaId: string): IdeaHistory | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(historyStorageKey(ideaId));
  if (!raw) return null;
  try {
    return parseIdeaHistory(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeRaw(history: IdeaHistory): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(historyStorageKey(history.ideaId), JSON.stringify(history));
}

/** Browser localStorage repository for the prototype (not the final store). */
export function createLocalIdeaHistoryRepository(): IdeaHistoryRepository {
  return {
    async loadIdeaHistory(ideaId) {
      return readRaw(ideaId) ?? emptyIdeaHistory(ideaId);
    },
    async saveResult(result) {
      const history = readRaw(result.ideaId) ?? emptyIdeaHistory(result.ideaId);
      const idx = history.results.findIndex((r) => r.id === result.id);
      if (idx >= 0) history.results[idx] = result;
      else history.results.unshift(result);
      writeRaw(history);
    },
    async saveVersion(version) {
      const history = readRaw(version.ideaId) ?? emptyIdeaHistory(version.ideaId);
      history.versions.unshift(version);
      history.currentVersion = Math.max(history.currentVersion, version.version);
      writeRaw(history);
    },
    async markResultStatus(resultId, status) {
      const keys =
        typeof window === "undefined"
          ? []
          : Object.keys(localStorage).filter((k) => k.startsWith("brainstorm-history:"));
      for (const key of keys) {
        try {
          const history = parseIdeaHistory(JSON.parse(localStorage.getItem(key) ?? ""));
          if (!history) continue;
          const result = history.results.find((r) => r.id === resultId);
          if (!result) continue;
          result.status = status;
          writeRaw(history);
          return;
        } catch {
          /* continue */
        }
      }
    },
    async replaceHistory(history) {
      writeRaw(history);
    },
  };
}

export function ensureInitialVersion(params: {
  ideaId: string;
  draft: BrainstormDraft;
  history: IdeaHistory;
}): { history: IdeaHistory; version: IdeaVersion | null } {
  if (params.history.versions.length > 0) {
    return { history: params.history, version: null };
  }
  const version: IdeaVersion = {
    id: createVersionId(),
    ideaId: params.ideaId,
    version: 1,
    snapshot: { ...params.draft },
    origin: "initial",
    changesSummary: "Initial draft snapshot",
    createdAt: new Date().toISOString(),
  };
  return {
    history: {
      ...params.history,
      currentVersion: 1,
      versions: [version],
    },
    version,
  };
}

export function buildAcceptedVersion(params: {
  ideaId: string;
  nextDraft: BrainstormDraft;
  previousVersion: number;
  origin: IdeaVersionOrigin;
  sourceResultId?: string;
  changesSummary: string;
  published?: IdeaVersion["published"];
}): IdeaVersion {
  return {
    id: createVersionId(),
    ideaId: params.ideaId,
    version: params.previousVersion + 1,
    snapshot: { ...normalizeBrainstormDraft(params.nextDraft) },
    origin: params.origin,
    sourceResultId: params.sourceResultId,
    changesSummary: params.changesSummary,
    createdAt: new Date().toISOString(),
    published: params.published,
  };
}

/**
 * Recommended DB schema for a later phase (document only — not implemented).
 *
 * ideas(id, slug, title, canonical_json, current_version, created_at)
 * idea_versions(id, idea_id, version, snapshot_json, origin, source_result_id, changes_summary, created_at)
 * ideation_results(id, idea_id, idea_version, action, payload_json, status, created_at)
 * publications(id, idea_id, version, network, github_pr_url, atom_id, triple_id, tx_hashes, verified_at)
 */
export const RECOMMENDED_DB_SCHEMA_NOTE =
  "See idea-history.ts JSDoc for recommended relational schema.";
