"use client";

import { useEffect, useMemo, useState } from "react";
import type { Idea } from "@/lib/ideas/schema";
import type { IdeaFullState } from "@/lib/ideas/idea-state";
import {
  buildPublishPlan,
  type BrainstormDraft,
  type PublishPlan,
} from "@/lib/ideas/publish-plan";

interface DetailResponse {
  state: IdeaFullState;
}

type PublishStatus =
  | { state: "idle" }
  | { state: "loading"; label: string }
  | { state: "ok"; label: string; detail?: string }
  | { state: "error"; label: string; detail?: string };

function StatusMessage({ status }: { status: PublishStatus }) {
  if (status.state === "idle") return null;
  const tone =
    status.state === "error"
      ? "border-red-900/50 bg-red-950/30 text-red-200"
      : status.state === "ok"
        ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-200"
        : "border-sky-900/50 bg-sky-950/30 text-sky-200";
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tone}`}>
      <p className="font-medium">{status.label}</p>
      {"detail" in status && status.detail ? (
        <p className="mt-1 break-all text-xs">{status.detail}</p>
      ) : null}
    </div>
  );
}

interface BrainstormPublishSectionProps {
  idea: Idea;
  draft: BrainstormDraft;
}

export function BrainstormPublishSection({
  idea,
  draft,
}: BrainstormPublishSectionProps) {
  const isDraft = idea.slug.startsWith("draft-");
  const [state, setState] = useState<IdeaFullState | null>(null);
  const [loading, setLoading] = useState(!isDraft);
  const [status, setStatus] = useState<PublishStatus>({ state: "idle" });

  useEffect(() => {
    if (isDraft) return;
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
  }, [idea.slug, isDraft]);

  const plan: PublishPlan = useMemo(
    () => buildPublishPlan(idea, draft),
    [idea, draft],
  );

  function publishBody(githubOnly = false) {
    return JSON.stringify({
      slug: idea.slug,
      draft,
      githubOnly,
      ...(isDraft ? { idea } : {}),
    });
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(plan.markdown);
    setStatus({ state: "ok", label: "Markdown copié dans le presse-papiers." });
  }

  async function createGithubPr() {
    setStatus({
      state: "loading",
      label: "Ouverture d'une PR sur intuition-box/ideas…",
    });
    const res = await fetch("/api/publish/github-pr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: publishBody(true),
    });
    const data = (await res.json()) as {
      mode: string;
      prUrl?: string;
      reason?: string;
      error?: string;
    };
    if (!res.ok) {
      setStatus({
        state: "error",
        label: "La création automatique de PR a échoué.",
        detail: data.error,
      });
      return;
    }
    if (data.mode === "created") {
      setStatus({
        state: "ok",
        label: "PR ouverte sur intuition-box/ideas.",
        detail: data.prUrl,
      });
      return;
    }
    setStatus({
      state: "ok",
      label: "Mode manuel — copiez le Markdown ci-dessous.",
      detail: data.reason,
    });
  }

  async function publishOnchain() {
    setStatus({
      state: "loading",
      label: "Publication des atoms sur Intuition testnet…",
    });
    const res = await fetch("/api/publish/onchain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: publishBody(false),
    });
    const data = (await res.json()) as {
      message?: string;
      error?: string;
      hint?: string;
      result?: { ideaAtomId?: string; tripleTermId?: string };
    };
    if (!res.ok) {
      setStatus({
        state: "error",
        label: "Création des atoms non exécutée.",
        detail: [data.message, data.error, data.hint].filter(Boolean).join(" "),
      });
      return;
    }
    setStatus({
      state: "ok",
      label: "Atoms publiés onchain.",
      detail: data.result?.ideaAtomId
        ? `Atom ${data.result.ideaAtomId} · Triple ${data.result.tripleTermId}`
        : undefined,
    });
  }

  return (
    <section
      id="publication"
      className="scroll-mt-8 space-y-6 border-t border-[var(--border)] pt-8"
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--accent)]">
          Préparer & publier
        </p>
        <h2 className="mt-1 text-xl font-bold">PR GitHub puis atoms onchain</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Vérifiez l&apos;état scoped / onchain, puis déposez une PR sur{" "}
          <a
            href="https://github.com/intuition-box/ideas"
            className="text-[var(--accent)] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            intuition-box/ideas
          </a>{" "}
          avant la création des atoms.
        </p>
      </div>

      <StatusMessage status={status} />

      {isDraft ? (
        <p className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
          Brouillon nouveau : l&apos;état catalogue n&apos;est pas encore indexé.
          La PR et les atoms utilisent le contenu affiné ci-dessus.
        </p>
      ) : (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-semibold">État GitHub + onchain</h3>
          {loading ? (
            <p className="mt-2 text-sm text-[var(--muted)]">Vérification…</p>
          ) : state ? (
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-[var(--background)] p-3">
                <p className="text-xs text-[var(--muted)]">Scoped</p>
                <p className="font-medium">{state.db.scoped ? "Oui" : "Non"}</p>
              </div>
              <div className="rounded-lg bg-[var(--background)] p-3">
                <p className="text-xs text-[var(--muted)]">PR GitHub</p>
                <p className="font-medium">
                  {state.db.hasGithubPr ? "Oui" : "Non"}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--background)] p-3">
                <p className="text-xs text-[var(--muted)]">Atom indexé</p>
                <p className="break-all font-mono text-xs">
                  {state.onchain?.atomInIndexer ? state.onchain.atomId : "Non"}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--background)] p-3">
                <p className="text-xs text-[var(--muted)]">Triple cœur</p>
                <p className="font-medium">
                  {state.onchain?.coreTriplePresent ? "Oui" : "Non"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--muted)]">
              Impossible de charger l&apos;état.
            </p>
          )}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-semibold">Plan sémantique</h3>
          <p className="mt-3 rounded-lg bg-[var(--background)] p-3 font-mono text-xs">
            {plan.coreTriple.join(" - ")}
          </p>
          {!plan.readiness.onchainReady && plan.readiness.warnings.length > 0 ? (
            <ul className="mt-3 space-y-1 text-xs text-amber-200">
              {plan.readiness.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-semibold">Actions</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void publishOnchain()}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
            >
              Créer les atoms (onchain)
            </button>
            <button
              type="button"
              onClick={() => void createGithubPr()}
              className="rounded-lg border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)]"
            >
              PR GitHub seulement
            </button>
            <button
              type="button"
              onClick={() => void copyMarkdown()}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
            >
              Copier Markdown
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="font-semibold">Aperçu README (PR)</h3>
        <p className="mt-1 text-xs text-[var(--muted)]">{plan.githubPath}</p>
        <pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-[var(--background)] p-4 text-xs leading-relaxed text-[var(--muted)]">
          {plan.markdown}
        </pre>
      </section>
    </section>
  );
}
