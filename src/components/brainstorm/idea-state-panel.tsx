// src/components/brainstorm/idea-state-panel.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import type { IdeaFullState, IdeaNextAction } from "@/lib/ideas/idea-state";

const ACTION_COPY: Record<
  IdeaNextAction,
  { title: string; description: string }
> = {
  view_ready: {
    title: "Idea ready",
    description: "Scoped, PR, and on-chain presence detected.",
  },
  prepare_onchain: {
    title: "Finalize on-chain",
    description: "PR present — complete atom or core triple.",
  },
  sync_db: {
    title: "Sync",
    description: "On-chain detected but not marked scoped in catalog.",
  },
  brainstorm: {
    title: "Brainstorm",
    description: "Idea already worked in catalog — refine before PR.",
  },
  create_with_prompt: {
    title: "Create the idea",
    description: "Not scoped or PR yet — use the suggested prompt below.",
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
          label="Catalog (scoped)"
          ok={state.db.scoped}
          detail={
            state.db.scoped
              ? `Status: ${state.db.status}`
              : "Still raw catalog entry"
          }
        />
        <StatusBlock
          label="GitHub PR"
          ok={state.db.hasGithubPr}
          detail={state.db.hasGithubPr ? "PR on record" : "No PR detected"}
        />
        <StatusBlock
          label="On-chain"
          ok={Boolean(state.onchain?.atomInIndexer)}
          loading={loadingOnchain}
          detail={
            loadingOnchain
              ? "Checking…"
              : state.onchain?.atomInIndexer
                ? state.onchain.coreTriplePresent
                  ? "Atom + core triple"
                  : "Atom without core triple"
                : state.onchain === null
                  ? "Not verified"
                  : "No indexed atom"
          }
        />
      </section>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
        <h3 className="font-semibold text-[var(--accent)]">{action.title}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">{action.description}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/brainstorm/idea/${state.slug}`}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-black transition hover:bg-white"
        >
          Brainstorm
        </Link>
        <Link
          href={`/brainstorm/idea/${state.slug}#publication`}
          className="rounded-lg border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10"
        >
          Publish
        </Link>
        <Link
          href={`/ideas/${state.slug}`}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          Catalog entry
        </Link>
        {!state.db.hasGithubPr ? (
          <button
            type="button"
            onClick={() => void copyPrompt()}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-black transition hover:bg-white"
          >
            {copied ? "Copied" : "Copy prompt"}
          </button>
        ) : null}
        {githubPrUrl ? (
          <a
            href={githubPrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
          >
            View PR
          </a>
        ) : null}
      </div>

      {state.nextAction === "create_with_prompt" ||
      state.nextAction === "brainstorm" ? (
        <section>
          <h3 className="text-sm font-semibold">Suggested prompt</h3>
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
        {loading ? "…" : ok ? "Yes" : "No"}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>
    </div>
  );
}
