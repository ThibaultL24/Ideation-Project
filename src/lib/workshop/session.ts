// src/lib/workshop/session.ts
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import type { DeepResearchReport } from "./idea-research";
import type { IdeaBrief } from "./idea-brief";
import type { TripleDraft } from "./triple-draft";
import type { WorkshopGraphContext } from "./graph-context-types";
import type { BrainstormDirection, BrainstormReport } from "./brainstorm";
import type { OnchainPublishSummary } from "./decent-rep";
import type { WorkshopPath } from "./workshop-path";

export interface WorkshopSession {
  id: string;
  createdAt: string;
  /** explore = brainstorm first; precise = skip to Prepare PR */
  path?: WorkshopPath;
  rawIntent: string;
  /** Original exploration text before a brainstorm direction was chosen. */
  explorationPrompt?: string;
  brainstorm?: BrainstormReport;
  selectedDirectionId?: string;
  selectedDirection?: BrainstormDirection;
  catalogSlug?: string;
  catalogCanonicalId?: string;
  catalogTitle?: string;
  catalogDescription?: string;
  graphContext?: WorkshopGraphContext;
  deepResearch?: DeepResearchReport;
  ideaBrief?: IdeaBrief;
  tripleDraft?: TripleDraft | EnrichedTripleDraft;
  onchainPublish?: OnchainPublishSummary;
  /** ISO timestamp when the user finalized the downloadable idea brief sheet. */
  briefFinalizedAt?: string;
}

const STORAGE_KEY = "workshop-session-v5";

export function createSessionId(): string {
  return `ws_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultSession(seed?: Partial<WorkshopSession>): WorkshopSession {
  return {
    id: seed?.id ?? createSessionId(),
    createdAt: seed?.createdAt ?? new Date().toISOString(),
    path: seed?.path ?? "explore",
    rawIntent: seed?.rawIntent ?? "",
    explorationPrompt: seed?.explorationPrompt ?? seed?.rawIntent,
    brainstorm: seed?.brainstorm,
    selectedDirectionId: seed?.selectedDirectionId,
    selectedDirection: seed?.selectedDirection,
    catalogSlug: seed?.catalogSlug,
    catalogCanonicalId: seed?.catalogCanonicalId,
    catalogTitle: seed?.catalogTitle,
    catalogDescription: seed?.catalogDescription,
    graphContext: seed?.graphContext,
    deepResearch: seed?.deepResearch,
    ideaBrief: seed?.ideaBrief,
    tripleDraft: seed?.tripleDraft,
    onchainPublish: seed?.onchainPublish,
    briefFinalizedAt: seed?.briefFinalizedAt,
  };
}

export function loadSession(): WorkshopSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorkshopSession;
  } catch {
    return null;
  }
}

export function saveSession(session: WorkshopSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
