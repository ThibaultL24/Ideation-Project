// src/components/workshop/discover-workspace.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { GraphInspectResult } from "@/lib/intuition/graph-inspect";
import type { CatalogMatch } from "@/lib/workshop/discover-similar";
import type { GithubIssueHit } from "@/lib/workshop/github-discover";
import { loadSession, saveSession, type WorkshopSession } from "@/lib/workshop/session";
import { IntuitionInspectPanel } from "./intuition-inspect-panel";

interface DiscoverPayload {
  graphInspect: GraphInspectResult;
  catalogMatches: CatalogMatch[];
  githubIssues: GithubIssueHit[];
  githubSearchError?: string;
  overlap: { level: "low" | "medium" | "high"; message: string };
}

const RISK_STYLE: Record<DiscoverPayload["overlap"]["level"], string> = {
  low: "border-emerald-900/50 bg-emerald-950/20 text-emerald-200",
  medium: "border-amber-900/50 bg-amber-950/20 text-amber-200",
  high: "border-rose-900/50 bg-rose-950/20 text-rose-200",
};

export function DiscoverWorkspace() {
  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [data, setData] = useState<DiscoverPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNetwork, setActiveNetwork] = useState<"testnet" | "mainnet">("testnet");

  const ideaTitle =
    session?.catalogTitle?.trim() ||
    session?.rawIntent.trim().slice(0, 80) ||
    "New Idea";

  const fetchDiscover = useCallback(async (s: WorkshopSession) => {
    setLoading(true);
    const res = await fetch("/api/workshop/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawIntent: s.rawIntent,
        ideaTitle,
        canonicalId: s.catalogCanonicalId,
      }),
    });
    const json = await res.json();
    if (json.graphInspect) {
      setData(json as DiscoverPayload);
    }
    setLoading(false);
  }, [ideaTitle]);

  useEffect(() => {
    const stored = loadSession();
    setSession(stored);
    if (stored?.rawIntent?.trim()) void fetchDiscover(stored);
    else setLoading(false);
  }, [fetchDiscover]);

  function continueToRefine() {
    if (!session) return;
    const updated = {
      ...session,
      discoverCompletedAt: new Date().toISOString(),
    };
    saveSession(updated);
  }

  if (!session?.rawIntent?.trim()) {
    return (
      <div className="rounded-xl border border-[var(--border)] p-6">
        <p className="text-[var(--muted)]">Session vide.</p>
        <Link href="/workshop" className="mt-4 inline-block text-[var(--accent)]">
          Démarrer l&apos;atelier
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
          Étape 1 sur 3 · Découvrir
        </p>
        <h1 className="text-2xl font-bold">{ideaTitle}</h1>
        <p className="text-sm text-[var(--muted)]">
          Avant d&apos;affiner ton idée, vérifie ce qui existe déjà dans le catalogue,
          sur le graphe Intuition et sur GitHub. La publication se fait uniquement via une
          PR — pas d&apos;écriture on-chain depuis cet atelier.
        </p>
        <p className="text-xs text-[var(--muted)] whitespace-pre-wrap">{session.rawIntent}</p>
      </header>

      {loading && <p className="text-sm text-[var(--muted)]">Recherche de similarités…</p>}

      {data && (
        <>
          <div className={`rounded-xl border p-4 text-sm ${RISK_STYLE[data.overlap.level]}`}>
            <p className="text-xs uppercase tracking-wide opacity-80">
              Risque de doublon · {data.overlap.level}
            </p>
            <p className="mt-2 leading-relaxed">{data.overlap.message}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h2 className="text-sm font-semibold">Catalogue (300+ idées)</h2>
              {data.catalogMatches.length === 0 ? (
                <p className="text-xs text-[var(--muted)]">
                  Aucune fiche catalogue très proche — bon signal pour un angle neuf.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.catalogMatches.map((m) => (
                    <li
                      key={m.slug}
                      className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3"
                    >
                      <Link
                        href={`/ideas/${m.slug}`}
                        className="font-medium text-sm text-[var(--accent)] hover:underline"
                      >
                        {m.title}
                      </Link>
                      <p className="mt-1 text-xs text-[var(--muted)]">{m.tagline}</p>
                      <p className="mt-1 text-[10px] text-[var(--muted)]">
                        {m.category} · {m.matchReason}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h2 className="text-sm font-semibold">GitHub · intuition-box/ideas</h2>
              {data.githubSearchError && (
                <p className="text-xs text-amber-400/90">{data.githubSearchError}</p>
              )}
              {data.githubIssues.length === 0 && !data.githubSearchError && (
                <p className="text-xs text-[var(--muted)]">
                  Aucune issue/PR récente ne matche fortement tes mots-clés.
                </p>
              )}
              <ul className="space-y-2">
                {data.githubIssues.map((issue) => (
                  <li key={issue.url}>
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--accent)] hover:underline"
                    >
                      #{issue.number} {issue.title}
                    </a>
                    <span className="ml-2 text-[10px] text-[var(--muted)]">{issue.state}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Graphe Intuition</h2>
            <IntuitionInspectPanel
              data={data.graphInspect}
              loading={false}
              activeNetwork={activeNetwork}
              onNetworkChange={setActiveNetwork}
            />
          </section>
        </>
      )}

      <div className="flex flex-wrap gap-3 border-t border-[var(--border)] pt-6">
        <Link
          href="/workshop/refine"
          onClick={continueToRefine}
          className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black"
        >
          Continuer — affiner l&apos;idée →
        </Link>
        <button
          type="button"
          onClick={() => session && void fetchDiscover(session)}
          disabled={loading}
          className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm disabled:opacity-50"
        >
          Actualiser
        </button>
        <Link href="/workshop" className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm">
          ← Modifier l&apos;intent
        </Link>
      </div>
    </div>
  );
}
