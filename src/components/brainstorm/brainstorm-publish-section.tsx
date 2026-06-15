"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { Idea } from "@/lib/ideas/schema";
import type { IdeaFullState } from "@/lib/ideas/idea-state";
import {
  buildPublishPlan,
  type BrainstormDraft,
  type PublishPlan,
} from "@/lib/ideas/publish-plan";
import { GithubAuthPanel } from "@/components/github/github-auth-panel";

interface DetailResponse {
  state: IdeaFullState;
}

type PublishStatus =
  | { state: "idle" }
  | { state: "loading"; label: string }
  | { state: "ok"; label: string; detail?: string; prUrl?: string }
  | { state: "warning"; label: string; detail?: string; githubNewFileUrl?: string }
  | { state: "error"; label: string; detail?: string };

function StatusMessage({ status }: { status: PublishStatus }) {
  if (status.state === "idle") return null;
  const tone =
    status.state === "error"
      ? "border-red-900/50 bg-red-950/30 text-red-200"
      : status.state === "warning"
        ? "border-amber-900/50 bg-amber-950/30 text-amber-100"
        : status.state === "ok"
          ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-200"
          : "border-sky-900/50 bg-sky-950/30 text-sky-200";
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tone}`}>
      <p className="font-medium">{status.label}</p>
      {"detail" in status && status.detail ? (
        <p className="mt-1 break-all text-xs">{status.detail}</p>
      ) : null}
      {status.state === "ok" && status.prUrl ? (
        <a
          href={status.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-[var(--accent)] hover:underline"
        >
          Ouvrir la PR sur GitHub →
        </a>
      ) : null}
      {status.state === "warning" && status.githubNewFileUrl ? (
        <a
          href={status.githubNewFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-[var(--accent)] hover:underline"
        >
          Créer le fichier sur GitHub (navigateur) →
        </a>
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
  const pathname = usePathname();
  const isDraft = idea.slug.startsWith("draft-");
  const [state, setState] = useState<IdeaFullState | null>(null);
  const [loading, setLoading] = useState(!isDraft);
  const [status, setStatus] = useState<PublishStatus>({ state: "idle" });
  const [githubConnected, setGithubConnected] = useState(false);

  const returnTo = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.pathname}${window.location.hash || "#publication"}`;
    }
    return `${pathname}#publication`;
  }, [pathname]);

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

  function publishBody() {
    const currentReturnTo =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.hash || "#publication"}`
        : `${pathname}#publication`;
    return JSON.stringify({
      slug: idea.slug,
      draft,
      idea,
      prompt: idea.tagline || idea.description,
      category: idea.category,
      returnTo: currentReturnTo,
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

    let res: Response;
    try {
      res = await fetch("/api/publish/github-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: publishBody(),
      });
    } catch (err) {
      setStatus({
        state: "error",
        label: "Impossible de joindre l'API de publication.",
        detail: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    let data: {
      mode?: string;
      prUrl?: string;
      reason?: string;
      error?: string;
      githubNewFileUrl?: string;
      loginUrl?: string;
    };
    try {
      data = (await res.json()) as typeof data;
    } catch {
      setStatus({
        state: "error",
        label: "Réponse serveur invalide.",
      });
      return;
    }

    if (data.mode === "auth_required" || (res.status === 401 && data.loginUrl)) {
      setStatus({
        state: "warning",
        label: "Connexion GitHub requise.",
        detail: data.reason,
      });
      if (data.loginUrl) {
        window.location.href = data.loginUrl;
      }
      return;
    }

    if (data.mode === "created" && data.prUrl) {
      try {
        await navigator.clipboard.writeText(plan.markdown);
      } catch {
        /* ignore */
      }
      window.open(data.prUrl, "_blank", "noopener,noreferrer");
      setStatus({
        state: "ok",
        label: "PR créée sur intuition-box/ideas.",
        detail: data.prUrl,
        prUrl: data.prUrl,
      });
      return;
    }

    if (data.mode === "manual") {
      try {
        await navigator.clipboard.writeText(plan.markdown);
      } catch {
        /* ignore */
      }
      setStatus({
        state: "warning",
        label: "PR automatique non configurée — Markdown copié.",
        detail: data.reason,
        githubNewFileUrl: data.githubNewFileUrl,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(plan.markdown);
    } catch {
      /* ignore */
    }

    if (data.githubNewFileUrl) {
      setStatus({
        state: "warning",
        label: "PR automatique échouée — Markdown copié.",
        detail: data.error,
        githubNewFileUrl: data.githubNewFileUrl,
      });
      return;
    }

    setStatus({
      state: "error",
      label: res.status === 404 ? "Idée introuvable pour la PR." : "Échec GitHub API.",
      detail: [data.error, data.reason].filter(Boolean).join(" "),
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
        <h2 className="mt-1 text-xl font-bold">Publication via PR GitHub</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Les atoms Intuition sont créés après revue et fusion de la PR sur{" "}
          <a
            href="https://github.com/intuition-box/ideas"
            className="text-[var(--accent)] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            intuition-box/ideas
          </a>
          , pas depuis cette interface.
        </p>
      </div>

      <StatusMessage status={status} />

      <GithubAuthPanel
        returnTo={returnTo}
        onConnectedChange={setGithubConnected}
      />

      {isDraft ? (
        <p className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
          Brouillon nouveau : l&apos;état catalogue n&apos;est pas encore indexé.
          La PR reprend le contenu affiné ci-dessus.
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
              onClick={() => void createGithubPr()}
              disabled={!githubConnected}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ouvrir une PR GitHub
            </button>
            {!githubConnected ? (
              <p className="w-full text-xs text-[var(--muted)]">
                Connectez GitHub ci-dessus pour activer la création de PR.
              </p>
            ) : null}
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
