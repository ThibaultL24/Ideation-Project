// src/components/prepare/prepare-workspace.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Idea } from "@/lib/ideas/schema";
import type { IdeaFullState } from "@/lib/ideas/idea-state";
import { BOUNTY_PREDICATE_LABEL } from "@/lib/intuition/config";

interface PrepareWorkspaceProps {
  idea: Idea;
}

interface DetailResponse {
  state: IdeaFullState;
  prompt: string;
}

export function PrepareWorkspace({ idea }: PrepareWorkspaceProps) {
  const [state, setState] = useState<IdeaFullState | null>(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState(idea.title);
  const [predicate, setPredicate] = useState(BOUNTY_PREDICATE_LABEL);
  const [object, setObject] = useState("Intuition");
  const [hasBrainstormDraft, setHasBrainstormDraft] = useState(false);

  useEffect(() => {
    setHasBrainstormDraft(
      Boolean(localStorage.getItem(`brainstorm-draft:${idea.slug}`)),
    );
  }, [idea.slug]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/idea-state/${encodeURIComponent(idea.slug)}?verifyOnchain=true`,
        );
        if (res.ok) {
          const data = (await res.json()) as DetailResponse;
          setState(data.state);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [idea.slug]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--accent)]">
            Outil 2 · Prepare & Publish
          </p>
          <h1 className="mt-1 text-2xl font-bold">{idea.title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{idea.tagline}</p>
        </div>
        <Link
          href={`/brainstorm/${idea.slug}`}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          ← Brainstorm
        </Link>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Vérifiez l&apos;existant, formalisez le triple cœur de la bounty, puis
        publiez via PR GitHub et scripts onchain.
      </p>

      {hasBrainstormDraft ? (
        <p className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-4 py-2 text-sm text-emerald-300">
          Brouillon brainstorm détecté (localStorage).
        </p>
      ) : (
        <p className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-2 text-sm text-amber-200">
          Pas encore de brouillon brainstorm —{" "}
          <Link href={`/brainstorm/${idea.slug}`} className="underline">
            commencer par Brainstorm
          </Link>
          .
        </p>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold">État (DB + onchain)</h2>
        {loading ? (
          <p className="mt-2 text-sm text-[var(--muted)]">Vérification…</p>
        ) : state ? (
          <ul className="mt-3 space-y-1 text-sm text-[var(--muted)]">
            <li>Scoped : {state.db.scoped ? "oui" : "non"}</li>
            <li>PR GitHub : {state.db.hasGithubPr ? "oui" : "non"}</li>
            <li>
              Atom indexé :{" "}
              {state.onchain?.atomInIndexer ? state.onchain.atomId : "non"}
            </li>
            <li>
              Triple cœur :{" "}
              {state.onchain?.coreTriplePresent ? "oui" : "non"}
            </li>
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Impossible de charger l&apos;état.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold">Triple cœur (bounty 3A)</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Sujet · prédicat · objet — à valider avant publication.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs text-blue-400">Sujet</span>
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs text-orange-400">Prédicat</span>
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm"
              value={predicate}
              onChange={(e) => setPredicate(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs text-purple-400">Objet</span>
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm"
              value={object}
              onChange={(e) => setObject(e.target.value)}
            />
          </label>
        </div>
        <p className="mt-4 rounded-lg bg-[var(--background)] p-3 font-mono text-sm">
          <span className="text-blue-400">{subject}</span>{" "}
          <span className="text-orange-400">{predicate}</span>{" "}
          <span className="text-purple-400">{object}</span>
        </p>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold">Publication</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-[var(--muted)]">
          <li>
            PR : dépôt{" "}
            <a
              href="https://github.com/intuition-box/ideas"
              className="text-[var(--accent)] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              intuition-box/ideas
            </a>
          </li>
          <li>
            Onchain :{" "}
            <code className="text-xs">pnpm publish:one -- --slug={idea.slug}</code>
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
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
          Cartes
        </Link>
      </div>
    </div>
  );
}
