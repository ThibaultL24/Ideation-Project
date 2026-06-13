// src/lib/ideas/ideation-session.ts
import type { Idea } from "./schema";

export type IdeationSource = "catalog" | "free";

export interface IdeationAnswer {
  questionId: string;
  text: string;
}

export interface IdeationSession {
  id: string;
  intent: string;
  source: IdeationSource;
  catalogSlug?: string;
  catalogTitle?: string;
  freeSlug?: string;
  answers: IdeationAnswer[];
  synthesis?: {
    headline: string;
    reflection: string;
    perspectives: string[];
    appDescription: string;
  };
  createdAt: string;
}

const SESSION_KEY = "ideation-session-active";
const FREE_IDEA_PREFIX = "free-idea:";

export function createSessionId(): string {
  return `ide_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function saveIdeationSession(session: IdeationSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadIdeationSession(): IdeationSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IdeationSession;
  } catch {
    return null;
  }
}

export function saveFreeIdea(idea: Idea): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${FREE_IDEA_PREFIX}${idea.slug}`, JSON.stringify(idea));
}

export function loadFreeIdea(slug: string): Idea | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`${FREE_IDEA_PREFIX}${slug}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Idea;
  }
  catch {
    return null;
  }
}

export function draftStorageKey(slug: string): string {
  return `brainstorm-draft:${slug}`;
}
