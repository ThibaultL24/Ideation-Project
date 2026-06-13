// src/components/prepare/prepare-workspace.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Idea } from "@/lib/ideas/schema";
import type { IdeaFullState } from "@/lib/ideas/idea-state";
import { isFreeIdeaSlug } from "@/lib/ideas/free-idea";
import {
  buildPublishPlan,
  normalizeBrainstormDraft,
  type BrainstormDraft,
  type PublishPlan,
} from "@/lib/ideas/publish-plan";
import type { OnchainPublishPreview } from "@/lib/intuition/publish-preview";

interface PrepareWorkspaceProps {
  idea: Idea;
}

interface DetailResponse {
  state: IdeaFullState;
  prompt: string;
}

type PublishStatus =
  | { state: "idle" }
  | { state: "loading"; label: string }
  | { state: "ok"; label: string; detail?: string }
  | { state: "error"; label: string; detail?: string };

function draftStorageKey(slug: string) {
  return `brainstorm-draft:${slug}`;
}

function buildFreeIdeaState(idea: Idea): IdeaFullState {
  return {
    slug: idea.slug,
    canonicalId: idea.canonicalId,
    title: idea.title,
    category: idea.category,
    tagline: idea.tagline,
    db: {
      scoped: false,
      hasGithubPath: false,
      hasGithubPr: false,
      status: idea.status,
    },
    onchain: null,
    nextAction: "create_with_prompt",
    badges: ["libre", "a_travailler"],
  };
}

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

export function PrepareWorkspace({ idea }: PrepareWorkspaceProps) {
  const [state, setState] = useState<IdeaFullState | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<BrainstormDraft | null>(null);
  const [onchainPreview, setOnchainPreview] = useState<OnchainPublishPreview | null>(
    null,
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [status, setStatus] = useState<PublishStatus>({ state: "idle" });

  useEffect(() => {
    const raw = localStorage.getItem(draftStorageKey(idea.slug));
    if (!raw) return;
    try {
      setDraft(normalizeBrainstormDraft(JSON.parse(raw) as Partial<BrainstormDraft>));
    } catch {
      setDraft(null);
    }
  }, [idea.slug]);

  useEffect(() => {
    if (isFreeIdeaSlug(idea.slug)) {
      setState(buildFreeIdeaState(idea));
      setLoading(false);
      return;
    }
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
  }, [idea]);

  useEffect(() => {
    void (async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch("/api/publish/onchain/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: idea.slug, idea, draft }),
        });
        if (res.ok) {
          const data = (await res.json()) as { preview: OnchainPublishPreview };
          setOnchainPreview(data.preview);
        }
      } finally {
        setPreviewLoading(false);
      }
    })();
  }, [idea, draft]);

  const plan: PublishPlan = useMemo(
    () => buildPublishPlan(idea, draft),
    [idea, draft],
  );

  async function copyMarkdown() {
    await navigator.clipboard.writeText(plan.markdown);
    setStatus({ state: "ok", label: "Markdown copie dans le presse-papiers." });
  }

  async function createGithubPr() {
    setStatus({ state: "loading", label: "Preparation de la PR GitHub..." });
    const res = await fetch("/api/publish/github-pr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: idea.slug, idea, draft }),
    });
    const data = (await res.json()) as {
      mode: string;
      prUrl?: string;
      reason?: string;
      error?: string;
      plan?: PublishPlan;
    };
    if (!res.ok) {
      setStatus({
        state: "error",
        label: "La creation automatique de PR a echoue.",
        detail: data.error,
      });
      return;
    }
    if (data.mode === "created") {
      setStatus({
        state: "ok",
        label: "PR GitHub creee.",
        detail: data.prUrl,
      });
      return;
    }
    setStatus({
      state: "ok",
      label: "Mode manuel pret.",
      detail: data.reason,
    });
  }

  async function refreshIdeaState() {
    if (isFreeIdeaSlug(idea.slug)) return;
    const res = await fetch(
      `/api/idea-state/${encodeURIComponent(idea.slug)}?verifyOnchain=true`,
    );
    if (res.ok) {
      const data = (await res.json()) as DetailResponse;
      setState(data.state);
    }
  }

  async function publishOnchain() {
    setStatus({ state: "loading", label: "Publication onchain en cours..." });
    const res = await fetch("/api/publish/onchain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: idea.slug, idea, draft }),
    });
    const data = (await res.json()) as {
      mode: string;
      message?: string;
      error?: string;
      hint?: string;
      result?: {
        ideaAtomId?: string;
        tripleTermId?: string;
        explorerUrls?: { ideaAtom?: string; triple?: string };
        graphqlVerified?: boolean;
        coreTripleQueryable?: boolean;
      };
    };
    if (!res.ok) {
      setStatus({
        state: "error",
        label: "Publication onchain non executee.",
        detail: [data.error, data.hint].filter(Boolean).join(" "),
      });
      return;
    }

    await refreshIdeaState();

    const previewRes = await fetch("/api/publish/onchain/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: idea.slug, idea, draft }),
    });
    if (previewRes.ok) {
      const previewData = (await previewRes.json()) as {
        preview: OnchainPublishPreview;
      };
      setOnchainPreview(previewData.preview);
    }

    const label =
      data.mode === "already_complete"
        ? "Deja onchain."
        : "Publication onchain terminee.";

    setStatus({
      state: "ok",
      label,
      detail: [
        data.message,
        data.result?.ideaAtomId ? `Atom ${data.result.ideaAtomId}` : "",
        data.result?.tripleTermId ? `Triple ${data.result.tripleTermId}` : "",
        data.result?.explorerUrls?.ideaAtom,
        data.result?.graphqlVerified ? "GraphQL atom OK" : "",
        data.result?.coreTripleQueryable ? "Core triple queryable" : "",
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--accent)]">
            Outil 2 - Prepare & Publish
          </p>
          <h1 className="mt-1 text-2xl font-bold">{idea.title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{idea.tagline}</p>
        </div>
        <Link
          href={isFreeIdeaSlug(idea.slug) ? "/brainstorm" : `/brainstorm/${idea.slug}`}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          Brainstorm
        </Link>
      </div>

      <StatusMessage status={status} />

      {!draft ? (
        <p className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-2 text-sm text-amber-200">
          Pas encore de brouillon local. Vous pouvez publier le draft catalogue,
          ou retourner a Brainstorm pour enrichir l&apos;idee.
        </p>
      ) : (
        <p className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-4 py-2 text-sm text-emerald-300">
          Brouillon brainstorm detecte et integre au plan de publication.
        </p>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold">Etat GitHub + onchain</h2>
        {loading ? (
          <p className="mt-2 text-sm text-[var(--muted)]">Verification...</p>
        ) : state ? (
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-[var(--background)] p-3">
              <p className="text-xs text-[var(--muted)]">Scoped</p>
              <p className="font-medium">{state.db.scoped ? "Oui" : "Non"}</p>
            </div>
            <div className="rounded-lg bg-[var(--background)] p-3">
              <p className="text-xs text-[var(--muted)]">PR GitHub</p>
              <p className="font-medium">{state.db.hasGithubPr ? "Oui" : "Non"}</p>
            </div>
            <div className="rounded-lg bg-[var(--background)] p-3">
              <p className="text-xs text-[var(--muted)]">Atom indexe</p>
              <p className="break-all font-mono text-xs">
                {state.onchain?.atomInIndexer ? state.onchain.atomId : "Non"}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--background)] p-3">
              <p className="text-xs text-[var(--muted)]">Triple coeur</p>
              <p className="font-medium">
                {state.onchain?.coreTriplePresent ? "Oui" : "Non"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Impossible de charger l&apos;etat.
          </p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="font-semibold">Plan semantique</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p>
              <span className="text-[var(--muted)]">Atom:</span>{" "}
              <span className="font-medium">{plan.atom.label}</span>
            </p>
            <p className="rounded-lg bg-[var(--background)] p-3 font-mono text-xs">
              {plan.coreTriple.join(" - ")}
            </p>
            {plan.supportTriples.length > 0 ? (
              <ul className="space-y-1 text-xs text-[var(--muted)]">
                {plan.supportTriples.map((triple) => (
                  <li key={triple.join("|")}>{triple.join(" - ")}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="font-semibold">Publication</h2>
          {previewLoading ? (
            <p className="mt-3 text-sm text-[var(--muted)]">
              Calcul des couts SDK (atomCost, tripleCost)…
            </p>
          ) : onchainPreview ? (
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-[var(--muted)]">
                Reseau <strong className="text-white/90">{onchainPreview.network}</strong>
                {" · "}
                cout estime{" "}
                <strong className="text-white/90">
                  {onchainPreview.totalEstimatedCostFormatted}{" "}
                  {onchainPreview.nativeSymbol}
                </strong>
                {onchainPreview.walletBalanceFormatted
                  ? ` · solde ${onchainPreview.walletBalanceFormatted}`
                  : ""}
              </p>
              <ul className="space-y-2 text-xs">
                {onchainPreview.steps.map((step) => (
                  <li
                    key={step.id}
                    className="rounded-lg bg-[var(--background)] px-3 py-2"
                  >
                    <span className="font-medium">{step.label}</span>
                    {" — "}
                    {step.exists
                      ? "deja onchain"
                      : `a creer (~${(Number(step.estimatedCostWei) / 1e18).toFixed(6)} ${onchainPreview.nativeSymbol})`}
                  </li>
                ))}
              </ul>
              {onchainPreview.blockers.length > 0 ? (
                <ul className="space-y-1 text-xs text-amber-200">
                  {onchainPreview.blockers.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
              {onchainPreview.alreadyComplete ? (
                <p className="text-xs text-emerald-300">
                  Atom + triple cœur deja presents — rien a creer.
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void createGithubPr()}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-black transition hover:bg-white"
            >
              Soumettre en PR
            </button>
            <button
              type="button"
              onClick={() => void publishOnchain()}
              disabled={onchainPreview ? !onchainPreview.canPublish && !onchainPreview.alreadyComplete : false}
              className="rounded-lg border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] disabled:opacity-40"
            >
              {onchainPreview?.alreadyComplete
                ? "Verifier onchain"
                : "Publier onchain"}
            </button>
            <button
              type="button"
              onClick={() => void copyMarkdown()}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
            >
              Copier Markdown
            </button>
          </div>
          <p className="mt-4 text-xs text-[var(--muted)]">
            On-chain : SDK <code className="text-[10px]">pinThing</code> →{" "}
            <code className="text-[10px]">createAtomFromIpfsUri</code> →{" "}
            <code className="text-[10px]">createTripleStatement</code> via wallet
            serveur (<code className="text-[10px]">INTUITION_PRIVATE_KEY</code>).
            Les atoms existants sont reutilises (<code className="text-[10px]">multiVaultIsTermCreated</code>).
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold">Preview GitHub</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {plan.githubPath}
        </p>
        <pre className="mt-4 max-h-[30rem] overflow-auto rounded-lg bg-[var(--background)] p-4 text-xs leading-relaxed text-[var(--muted)]">
          {plan.markdown}
        </pre>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold">Fallback CLI</h2>
        <ol className="mt-3 list-inside list-decimal space-y-1 text-xs text-[var(--muted)]">
          {plan.fallbackCommands.map((command) => (
            <li key={command}>
              <code>{command}</code>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
