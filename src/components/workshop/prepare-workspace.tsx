// src/components/workshop/prepare-workspace.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import { formatTripleLine } from "@/lib/workshop/triple-draft";
import type { WorkshopPublishPlan } from "@/lib/workshop/publish-plan";
import { loadSession, saveSession, type WorkshopSession } from "@/lib/workshop/session";

export function PrepareWorkspace() {
  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [plan, setPlan] = useState<WorkshopPublishPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [triplesLoading, setTriplesLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubResult, setGithubResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  const fetchPlan = useCallback(async (s: WorkshopSession) => {
    setLoadingPlan(true);
    const res = await fetch("/api/workshop/prepare/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: s }),
    });
    const data = await res.json();
    if (data.plan) setPlan(data.plan as WorkshopPublishPlan);
    setLoadingPlan(false);
  }, []);

  useEffect(() => {
    if (session) void fetchPlan(session);
  }, [session, fetchPlan]);

  async function generateTriples() {
    if (!session) return;
    setTriplesLoading(true);
    const res = await fetch("/api/assist/triples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    });
    const data = await res.json();
    if (data.draft) {
      const updated = {
        ...session,
        tripleDraft: data.draft as EnrichedTripleDraft,
      };
      saveSession(updated);
      setSession(updated);
      void fetchPlan(updated);
    }
    setTriplesLoading(false);
  }

  async function createPr() {
    if (!session) return;
    setGithubLoading(true);
    setGithubResult(null);
    const res = await fetch("/api/workshop/prepare/github-pr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    });
    setGithubResult(await res.json());
    setGithubLoading(false);
  }

  if (!session?.rawIntent) {
    return (
      <div className="rounded-xl border border-[var(--border)] p-6">
        <p className="text-[var(--muted)]">Session vide.</p>
        <Link href="/workshop" className="mt-4 inline-block text-[var(--accent)]">
          Démarrer l&apos;atelier
        </Link>
      </div>
    );
  }

  if (!session.ideaBrief?.problem?.trim()) {
    return (
      <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-6 space-y-4">
        <p className="text-sm">Consolide d&apos;abord ton idée au brainstorm.</p>
        <Link href="/workshop/brainstorm" className="text-[var(--accent)]">
          ← Brainstorm
        </Link>
      </div>
    );
  }

  const brief = session.ideaBrief;
  const draft = session.tripleDraft;
  const hasTriples = Boolean(draft);
  const guide = plan?.publishGuide;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
          Étape 3 sur 3 · Proposer en PR
        </p>
        <h1 className="text-2xl font-bold">{brief.title || session.catalogTitle}</h1>
        <p className="text-sm text-[var(--muted)]">{brief.oneLiner}</p>
        <p className="text-xs text-[var(--muted)]">
          Les triples Intuition documentent le modèle sémantique dans la PR. Aucune
          transaction on-chain n&apos;est envoyée depuis cet atelier.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm space-y-2">
        <p className="text-xs text-[var(--accent)]">Fiche idée (brainstorm)</p>
        <p className="text-xs text-[var(--muted)]">
          <strong>Problème :</strong> {brief.problem.slice(0, 200)}
          {brief.problem.length > 200 ? "…" : ""}
        </p>
      </section>

      {!hasTriples && (
        <section className="space-y-4 rounded-xl border border-[var(--accent)]/30 p-5">
          <h2 className="text-sm font-semibold">Modèle sémantique Intuition</h2>
          <p className="text-xs text-[var(--muted)]">
            L&apos;IA s&apos;appuie sur la doc Intuition et des exemples réels du graphe.
            Triple cœur obligatoire : [titre] → top project ideas for → Intuition Protocol.
            Support et nested documentés dans le README de la PR uniquement.
          </p>
          <button
            type="button"
            onClick={() => void generateTriples()}
            disabled={triplesLoading}
            className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50"
          >
            {triplesLoading ? "Préparation…" : "Préparer les triples pour la PR"}
          </button>
        </section>
      )}

      {hasTriples && draft && (
        <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold">Aperçu des triples (PR)</h2>
          <p className="font-mono text-xs text-[var(--muted)]">
            {formatTripleLine(draft.coreTriple)}
          </p>
          {draft.supportTriples.map((t, i) => (
            <p key={i} className="font-mono text-xs text-[var(--muted)]">
              {formatTripleLine(t)}
            </p>
          ))}
          {draft.nestedTriples.map((t, i) => (
            <p key={i} className="font-mono text-xs text-amber-400/80">
              nested · {formatTripleLine(t)}
            </p>
          ))}
          {(draft.linterWarnings?.length ?? 0) > 0 && (
            <ul className="text-xs text-amber-400/90">
              {draft.linterWarnings.map((w, i) => (
                <li key={i}>⚠ {w}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {loadingPlan && hasTriples && (
        <p className="text-sm text-[var(--muted)]">Chargement du plan PR…</p>
      )}

      {hasTriples && plan && guide && (
        <section className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
            <p className="text-sm font-medium">{guide.headline}</p>
            <ul className="list-disc space-y-1 pl-4 text-xs text-[var(--muted)]">
              {guide.checks.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          <details className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <summary className="cursor-pointer px-4 py-3 text-sm">
              Aperçu markdown de la PR
            </summary>
            <pre className="max-h-64 overflow-auto border-t border-[var(--border)] p-4 text-xs whitespace-pre-wrap text-[var(--muted)]">
              {plan.markdown}
            </pre>
          </details>

          <button
            type="button"
            onClick={() => void createPr()}
            disabled={githubLoading || !plan.readiness.githubReady}
            className="w-full rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black disabled:opacity-40"
          >
            {githubLoading ? "Dépôt de la PR…" : "Déposer la PR sur GitHub"}
          </button>

          {githubResult?.mode === "manual" && (
            <div className="space-y-2 text-xs text-amber-400/90">
              <p>
                {typeof githubResult.reason === "string"
                  ? githubResult.reason
                  : "Configure .env pour le dépôt automatique, ou utilise les liens ci-dessous."}
              </p>
              {typeof githubResult.manual === "object" && githubResult.manual !== null && (
                <>
                  {"instructions" in (githubResult.manual as object) && (
                    <p>{(githubResult.manual as { instructions: string }).instructions}</p>
                  )}
                  {"newFileUrl" in (githubResult.manual as object) && (
                    <a
                      href={(githubResult.manual as { newFileUrl: string }).newFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[var(--accent)] break-all"
                    >
                      Ouvrir l&apos;éditeur GitHub (nouveau fichier → PR)
                    </a>
                  )}
                </>
              )}
            </div>
          )}
          {typeof githubResult?.publishRepo === "string" && (
            <p className="text-[10px] text-[var(--muted)]">
              Commit : {githubResult.publishRepo as string}
              {typeof githubResult.targetRepo === "string"
                ? ` → PR : ${githubResult.targetRepo as string}`
                : ""}
            </p>
          )}
          {typeof githubResult?.error === "string" && (
            <p className="text-xs text-rose-400">{githubResult.error}</p>
          )}
          {typeof githubResult?.prUrl === "string" && (
            <a
              href={githubResult.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-[var(--accent)] break-all"
            >
              {githubResult.prUrl}
            </a>
          )}

          {plan.readiness.warnings.length > 0 && (
            <ul className="text-xs text-amber-400/90">
              {plan.readiness.warnings.map((w, i) => (
                <li key={i}>⚠ {w}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/workshop/brainstorm" className="text-[var(--muted)] hover:text-white">
          ← Modifier la fiche
        </Link>
        <Link href="/workshop/discover" className="text-[var(--muted)] hover:text-white">
          Similarités
        </Link>
      </div>
    </div>
  );
}
