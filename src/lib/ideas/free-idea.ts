// src/lib/ideas/free-idea.ts
import type { Idea } from "./schema";
import { slugifyTitle } from "./slug";

export interface FreeIdea {
  id: string;
  title: string;
  tagline: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const INDEX_KEY = "free-ideas-index";

function ideaStorageKey(id: string) {
  return `free-idea:${id}`;
}

function readIndex(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeIndex(ids: string[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

export function createFreeIdea(input: {
  title: string;
  tagline: string;
  description?: string;
}): FreeIdea {
  const title = input.title.trim();
  const tagline = input.tagline.trim();
  if (title.length < 2) throw new Error("Titre requis (2 caractères minimum).");
  if (tagline.length < 5) throw new Error("Pitch requis (5 caractères minimum).");

  const base = slugifyTitle(title) || "idee";
  const id = `libre-${base}-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const idea: FreeIdea = {
    id,
    title,
    tagline,
    description: (input.description ?? tagline).trim(),
    createdAt: now,
    updatedAt: now,
  };

  localStorage.setItem(ideaStorageKey(id), JSON.stringify(idea));
  const index = readIndex();
  if (!index.includes(id)) {
    writeIndex([id, ...index]);
  }

  return idea;
}

export function loadFreeIdea(id: string): FreeIdea | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ideaStorageKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FreeIdea;
  } catch {
    return null;
  }
}

export function saveFreeIdea(idea: FreeIdea): void {
  const next = { ...idea, updatedAt: new Date().toISOString() };
  localStorage.setItem(ideaStorageKey(idea.id), JSON.stringify(next));
}

export function listFreeIdeas(): FreeIdea[] {
  return readIndex()
    .map((id) => loadFreeIdea(id))
    .filter((i): i is FreeIdea => i !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function deleteFreeIdea(id: string): void {
  localStorage.removeItem(ideaStorageKey(id));
  writeIndex(readIndex().filter((x) => x !== id));
  localStorage.removeItem(`scamper-draft:${id}`);
  localStorage.removeItem(`brainstorm-draft:${id}`);
}

export function isFreeIdeaId(id: string): boolean {
  return id.startsWith("libre-");
}

/** Adaptation minimale pour réutiliser Brainstorm / similarité catalogue. */
export function freeIdeaToCatalogShape(free: FreeIdea): Idea {
  return {
    canonicalId: `free:${free.id}`,
    slug: free.id,
    title: free.title,
    tagline: free.tagline,
    description: free.description,
    category: "Idée libre",
    categoryIndex: 0,
    ideaIndex: 0,
    tags: ["free-idea", "scamper"],
    status: "draft",
  };
}
