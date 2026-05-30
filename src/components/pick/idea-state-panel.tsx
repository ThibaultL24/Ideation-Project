// src/components/pick/idea-state-panel.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import type { IdeaFullState, IdeaNextAction } from "@/lib/ideas/idea-state";

const ACTION_COPY: Record<
  IdeaNextAction,
  { title: string; description: string }
> = {
  view_ready: {
    title: "Idée prête",
    description: "Scoped, PR et présence onchain détectées.",
  },
  prepare_onchain: {
    title: "Finaliser onchain",
    description: "PR présente — compléter atom ou triple cœur.",
  },
  sync_db: {
    title: "Synchroniser",
    description: "Onchain détecté mais pas marqué scoped en base.",
  },
  brainstorm: {
    title: "Brainstorm",
    description: "Idée déjà travaillée en base — affiner avant PR.",
  },
  create_with_prompt: {
    title: "Créer l'idée",
    description: "Pas encore scoped ni PR — utiliser le prompt ci-dessous.",
  },
};

interface IdeaStatePanelProps {
  state: IdeaFullState;
  prompt: string;
  loadingOnchain: boolean;
  githubPrUrl?: string;
}

export function IdeaStatePanel({
  state,
  prompt,
  loadingOnchain,
  githubPrUrl,
}: IdeaStatePanelProps) {
  const [copied, setCopied] = useState(false);
  const action = ACTION_COPY[state.nextAction];

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--accent)]">
          {state.category}
        </p>
        <h2 className="mt-1 text-2xl font-bold">{state.title}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{state.tagline}</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatusBlock
          label="Base (scoped)"
          ok={state.db.scoped}
          detail={
            state.db.scoped
              ? `Statut : ${state.db.status}`
              : "Encore au catalogue brut"
          }
        />
        <StatusBlock
          label="GitHub PR"
          ok={state.db.hasGithubPr}
          detail={
            state.db.hasGithubPr ? "PR enregistrée" : "Aucune PR détectée"
          }
        />
        <StatusBlock
          label="Onchain"
          ok={Boolean(state.onchain?.atomInIndexer)}
          loading={loadingOnchain}
          detail={
            loadingOnchain
              ? "Vérification…"
              : state.onchain?.atomInIndexer
                ? state.onchain.coreTriplePresent
                  ? "Atom + triple cœur"
                  : "Atom sans triple cœur"
                : state.onchain === null
                  ? "Non vérifié"
                  : "Pas d'atom indexé"
          }
        />
      </section>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
        <h3 className="font-semibold text-[var(--accent)]">{action.title}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">{action.description}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/scamper/${state.slug}`}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
        >
          SCAMPER
        </Link>
        <Link
          href={`/brainstorm/${state.slug}`}
          className="rounded-lg border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10"
        >
          Brainstorm
        </Link>
        <Link
          href={`/prepare/${state.slug}`}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          Prepare
        </Link>
        <Link
          href={`/ideas/${state.slug}`}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          Fiche catalogue
        </Link>
        {!state.db.hasGithubPr ? (
          <button
            type="button"
            onClick={copyPrompt}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
          >
            {copied ? "Copié" : "Copier le prompt"}
          </button>
        ) : null}
        {githubPrUrl ? (
          <a
            href={githubPrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
          >
            Voir la PR
          </a>
        ) : null}
      </div>

      {state.nextAction === "create_with_prompt" ||
      state.nextAction === "brainstorm" ? (
        <section>
          <h3 className="text-sm font-semibold">Prompt suggéré</h3>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-[var(--background)] p-4 text-xs text-[var(--muted)] whitespace-pre-wrap">
            {prompt}
          </pre>
        </section>
      ) : null}
    </div>
  );
}

function StatusBlock({
  label,
  ok,
  detail,
  loading,
}: {
  label: string;
  ok: boolean;
  detail: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p
        className={`mt-1 text-sm font-medium ${
          loading ? "text-[var(--muted)]" : ok ? "text-emerald-400" : "text-amber-400"
        }`}
      >
        {loading ? "…" : ok ? "Oui" : "Non"}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>
    </div>
  );
}
