// src/components/brainstorm/brainstorm-workspace.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Idea } from "@/lib/ideas/schema";

const SECTIONS = [
  {
    id: "problem",
    label: "Problème",
    placeholder: "Qui souffre de quoi ? Comment s'en sort-on aujourd'hui ?",
  },
  {
    id: "solution",
    label: "Solution",
    placeholder: "Que fait le produit ? Parcours utilisateur en 3 étapes.",
  },
  {
    id: "users",
    label: "Utilisateurs cibles",
    placeholder: "Les 100 premiers utilisateurs — soyez précis.",
  },
  {
    id: "intuitionFit",
    label: "Pourquoi Intuition",
    placeholder: "Atoms, triples, staking — qu'est-ce qui est indispensable ?",
  },
  {
    id: "mvp",
    label: "MVP (3 écrans)",
    placeholder: "Écran 1, 2, 3 — version hackathon.",
  },
] as const;

type DraftKey = (typeof SECTIONS)[number]["id"];

function storageKey(slug: string) {
  return `brainstorm-draft:${slug}`;
}

interface BrainstormWorkspaceProps {
  idea: Idea;
}

export function BrainstormWorkspace({ idea }: BrainstormWorkspaceProps) {
  const [draft, setDraft] = useState<Record<DraftKey, string>>({
    problem: "",
    solution: "",
    users: "",
    intuitionFit: "",
    mvp: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey(idea.slug));
    if (!raw) {
      setDraft({
        problem: idea.description.slice(0, 500),
        solution: "",
        users: "",
        intuitionFit: "",
        mvp: "",
      });
      return;
    }
    try {
      setDraft(JSON.parse(raw) as Record<DraftKey, string>);
    } catch {
      /* ignore */
    }
  }, [idea.slug, idea.description]);

  function updateField(id: DraftKey, value: string) {
    setDraft((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  }

  function saveDraft() {
    localStorage.setItem(storageKey(idea.slug), JSON.stringify(draft));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--accent)]">
            Outil 1 · Brainstorm
          </p>
          <h1 className="mt-1 text-2xl font-bold">{idea.title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{idea.tagline}</p>
        </div>
        <Link
          href={`/prepare/${idea.slug}`}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
        >
          Préparer & publier →
        </Link>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Affinez l&apos;idée ici (créatif, sans contrainte graphe). Une fois le
        brouillon prêt, passez à <strong>Prepare</strong> pour similarités,
        triples et publication.
      </p>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <label key={section.id} className="block">
            <span className="text-sm font-semibold">{section.label}</span>
            <textarea
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              rows={4}
              placeholder={section.placeholder}
              value={draft[section.id]}
              onChange={(e) => updateField(section.id, e.target.value)}
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveDraft}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          {saved ? "Enregistré" : "Enregistrer le brouillon"}
        </button>
        <Link
          href={`/ideas/${idea.slug}`}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          Fiche catalogue
        </Link>
        <Link
          href="/pick"
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          Retour aux cartes
        </Link>
      </div>
    </div>
  );
}
