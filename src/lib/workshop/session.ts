// src/lib/workshop/session.ts
import type { CardPick } from "./card-tree";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import type { DebriefAnswer, IdeaDebrief } from "./idea-debrief";
import type { IdeaBrief } from "./idea-brief";
import type { TripleDraft } from "./triple-draft";

export interface WorkshopSession {
  id: string;
  createdAt: string;
  rawIntent: string;
  catalogSlug?: string;
  catalogCanonicalId?: string;
  catalogTitle?: string;
  catalogDescription?: string;
  picks: CardPick[];
  refinementSummary: string;
  discoverCompletedAt?: string;
  debriefQuestions?: string[];
  debriefAnswers?: DebriefAnswer[];
  ideaDebrief?: IdeaDebrief;
  ideaBrief?: IdeaBrief;
  tripleDraft?: TripleDraft | EnrichedTripleDraft;
}

const STORAGE_KEY = "workshop-session-v2";

export function createSessionId(): string {
  return `ws_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultSession(seed?: Partial<WorkshopSession>): WorkshopSession {
  return {
    id: seed?.id ?? createSessionId(),
    createdAt: seed?.createdAt ?? new Date().toISOString(),
    rawIntent: seed?.rawIntent ?? "",
    catalogSlug: seed?.catalogSlug,
    catalogTitle: seed?.catalogTitle,
    picks: seed?.picks ?? [],
    refinementSummary: seed?.refinementSummary ?? "",
    tripleDraft: seed?.tripleDraft,
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
