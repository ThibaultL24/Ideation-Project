// src/components/workshop/prepare-workspace.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import { formatTripleLine } from "@/lib/workshop/triple-draft";
import type { WorkshopPublishPlan } from "@/lib/workshop/publish-plan";
import { loadSession, saveSession, type WorkshopSession } from "@/lib/workshop/session";
import { canOpenPrepare, resolveSessionBrief } from "@/lib/workshop/workshop-path";
import { PreparePrGuidePanel } from "./prepare-pr-guide-panel";
import { SemanticPreview } from "./semantic-preview";

export function PrepareWorkspace() {
  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [plan, setPlan] = useState<WorkshopPublishPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [triplesLoading, setTriplesLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubResult, setGithubResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const stored = loadSession();
    if (!stored?.rawIntent?.trim()) {
      setSession(null);
      return;
    }
    if (!canOpenPrepare(stored)) {
      setSession(stored);
      return;
    }
    const ideaBrief = resolveSessionBrief(stored);
    const merged = { ...stored, ideaBrief };
    if (JSON.stringify(stored.ideaBrief) !== JSON.stringify(ideaBrief)) {
      saveSession(merged);
    }
    setSession(merged);
  }, []);

  const fetchPlan = useCallback(async (s: WorkshopSession) => {
    setLoadingPlan(true);
    const normalized = { ...s, ideaBrief: resolveSessionBrief(s) };
    const res = await fetch("/api/workshop/prepare/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: normalized }),
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
    const normalized = { ...session, ideaBrief: resolveSessionBrief(session) };
    const res = await fetch("/api/assist/triples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: normalized }),
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
    const normalized = { ...session, ideaBrief: resolveSessionBrief(session) };
    const res = await fetch("/api/workshop/prepare/github-pr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: normalized }),
    });
    setGithubResult(await res.json());
    setGithubLoading(false);
  }

  if (!session?.rawIntent) {
    return (
      <div className="rounded-xl border border-[var(--border)] p-6">
        <p className="text-[var(--muted)]">Empty session.</p>
        <Link href="/workshop" className="mt-4 inline-block text-[var(--accent)]">
          Start workshop
        </Link>
      </div>
    );
  }

  if (!canOpenPrepare(session)) {
    return (
      <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-6 space-y-4">
        <p className="text-sm">
          Start from the workshop: explore and pick a direction, or use « I have a clear idea »
          to open Prepare directly.
        </p>
        <Link href="/workshop" className="text-[var(--accent)]">
          ← Workshop
        </Link>
      </div>
    );
  }

  const brief = resolveSessionBrief(session);
  const draft = session.tripleDraft;
  const hasTriples = Boolean(draft);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_260px]">
      <div className="space-y-8 min-w-0">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
            Final step · Prepare → GitHub PR
          </p>
          <h1 className="text-2xl font-bold">{brief.title || session.catalogTitle}</h1>
          <p className="text-sm text-[var(--muted)]">{brief.oneLiner}</p>
          <p className="text-xs text-[var(--muted)]">
            {session.path === "precise"
              ? "You skipped brainstorming. Draft triples and open the pull request — no on-chain publish from here."
              : "When the idea pleases you, push the PR from here. Deep research was optional enrichment."}
          </p>
        </header>

        {!hasTriples && (
          <section className="space-y-4 rounded-xl border border-[var(--accent)]/30 p-5">
            <h2 className="text-sm font-semibold">Intuition semantic model</h2>
            <p className="text-xs text-[var(--muted)]">
              AI drafts triples for the PR README. Required core: [title] → top project
              ideas for → Intuition Protocol.
            </p>
            <button
              type="button"
              onClick={() => void generateTriples()}
              disabled={triplesLoading}
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50"
            >
              {triplesLoading ? "Preparing…" : "Prepare triples for PR"}
            </button>
          </section>
        )}

        {hasTriples && draft && (
          <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Triple preview (PR README)</h2>
              <button
                type="button"
                onClick={() => void generateTriples()}
                disabled={triplesLoading}
                className="text-xs text-[var(--accent)] disabled:opacity-50"
              >
                {triplesLoading ? "Regenerating…" : "Regenerate triples"}
              </button>
            </div>
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
          <p className="text-sm text-[var(--muted)]">Loading PR plan…</p>
        )}

        {hasTriples && plan && (
          <section className="space-y-4">
            <PreparePrGuidePanel guide={plan.prGuide} />

            <details className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <summary className="cursor-pointer px-4 py-3 text-sm">
                PR markdown preview
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
              {githubLoading ? "Opening PR…" : "Create GitHub PR"}
            </button>

            {githubResult?.mode === "manual" && (
              <div className="space-y-2 text-xs text-amber-400/90">
                <p>
                  {typeof githubResult.reason === "string"
                    ? githubResult.reason
                    : "Configure .env for automatic PR creation, or use the links below."}
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
                        Open GitHub editor (new file → PR)
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
          <Link href="/workshop/research" className="text-[var(--muted)] hover:text-white">
            {session.path === "precise" ? "← Enrich on Research (optional)" : "← Brainstorm / research"}
          </Link>
          <Link href="/workshop" className="text-[var(--muted)] hover:text-white">
            ← New idea
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <SemanticPreview
          ideaTitle={brief.title || session.catalogTitle || "New Idea"}
          ideaBrief={brief}
          tripleDraft={draft as EnrichedTripleDraft | undefined}
          graphContext={session.graphContext}
          showCreateVsSignal
        />
      </div>
    </div>
  );
}
