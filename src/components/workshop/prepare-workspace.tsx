// src/components/workshop/prepare-workspace.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import type { WorkshopPublishPlan } from "@/lib/workshop/publish-plan";
import { loadSession, saveSession, type WorkshopSession } from "@/lib/workshop/session";

function StepBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    exists: "border-emerald-800/60 text-emerald-300",
    will_create: "border-amber-800/60 text-amber-300",
    skip: "border-blue-800/60 text-blue-300",
    preview: "border-[var(--border)] text-[var(--muted)]",
  };
  return (
    <span
      className={`rounded border px-2 py-0.5 text-[10px] uppercase ${styles[status] ?? styles.preview}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function PrepareWorkspace() {
  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [plan, setPlan] = useState<WorkshopPublishPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [triplesLoading, setTriplesLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [onchainLoading, setOnchainLoading] = useState(false);
  const [githubResult, setGithubResult] = useState<Record<string, unknown> | null>(null);
  const [onchainResult, setOnchainResult] = useState<Record<string, unknown> | null>(null);
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");

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

  async function publishOnchain() {
    if (!session?.tripleDraft) return;
    setOnchainLoading(true);
    setOnchainResult(null);
    const prUrl =
      typeof githubResult?.prUrl === "string" ? githubResult.prUrl : undefined;
    const res = await fetch("/api/workshop/prepare/onchain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session, network, githubBlobUrl: prUrl }),
    });
    setOnchainResult(await res.json());
    setOnchainLoading(false);
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
  const hasTriples = Boolean(session.tripleDraft);
  const guide = plan?.publishGuide;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-[var(--accent)]">Publier</p>
        <h1 className="text-2xl font-bold">{brief.title || session.catalogTitle}</h1>
        <p className="text-sm text-[var(--muted)]">{brief.oneLiner}</p>
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
          <h2 className="text-sm font-semibold">Écrire pour Intuition</h2>
          <p className="text-xs text-[var(--muted)]">
            À partir de ta fiche, l&apos;IA propose atoms et triples alignés sur le graphe
            (decentrep-like). C&apos;est l&apos;étape d&apos;écriture protocolaire — pas au
            brainstorm.
          </p>
          <button
            type="button"
            onClick={() => void generateTriples()}
            disabled={triplesLoading}
            className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50"
          >
            {triplesLoading ? "Préparation…" : "Préparer les triples Intuition"}
          </button>
        </section>
      )}

      {loadingPlan && hasTriples && (
        <p className="text-sm text-[var(--muted)]">Chargement du plan…</p>
      )}

      {hasTriples && plan && guide && (
        <>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
            <p className="text-sm font-medium">{guide.headline}</p>
            <ul className="list-disc space-y-1 pl-4 text-xs text-[var(--muted)]">
              {guide.checks.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-4">
              <h2 className="text-sm font-semibold">GitHub</h2>
              <details className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
                <summary className="cursor-pointer px-4 py-3 text-sm">Markdown PR</summary>
                <pre className="max-h-48 overflow-auto border-t border-[var(--border)] p-4 text-xs whitespace-pre-wrap text-[var(--muted)]">
                  {plan.markdown}
                </pre>
              </details>
              <button
                type="button"
                onClick={() => void createPr()}
                disabled={githubLoading || !plan.readiness.githubReady}
                className="w-full rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm disabled:opacity-40"
              >
                {githubLoading ? "…" : "Créer la PR GitHub"}
              </button>
              {typeof githubResult?.prUrl === "string" && (
                <a
                  href={githubResult.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-[var(--accent)] break-all"
                >
                  {githubResult.prUrl}
                </a>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold">Intuition onchain</h2>
              <div className="flex gap-2">
                {(["testnet", "mainnet"] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNetwork(n)}
                    className={`rounded px-3 py-1 text-xs uppercase ${
                      network === n
                        ? "bg-[var(--accent)] text-black"
                        : "border border-[var(--border)]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
                {plan.onchainSteps.map((step) => (
                  <li
                    key={step.id}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3"
                  >
                    <StepBadge status={step.status} />
                    <span className="ml-2">{step.label}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => void publishOnchain()}
                disabled={
                  onchainLoading ||
                  !plan.readiness.onchainReady ||
                  Boolean(guide.publishBlockedReason)
                }
                className="w-full rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black disabled:opacity-40"
              >
                {onchainLoading ? "…" : `Publier onchain (${network})`}
              </button>
              {onchainResult && (
                <pre className="max-h-32 overflow-auto rounded border border-[var(--border)] p-2 text-[10px]">
                  {JSON.stringify(onchainResult, null, 2)}
                </pre>
              )}
            </section>
          </div>
        </>
      )}

      <Link href="/workshop/brainstorm" className="text-sm text-[var(--muted)] hover:text-white">
        ← Modifier la fiche idée
      </Link>
    </div>
  );
}
