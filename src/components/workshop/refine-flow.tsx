// src/components/workshop/refine-flow.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { BrainstormCoach } from "@/lib/assist/generate-brainstorm";
import type { GraphInspectResult } from "@/lib/intuition/graph-inspect";
import {
  buildRefinementSummary,
  isRefinementComplete,
  MAX_CARD_DEPTH,
  type CardLevel,
  type CardPick,
  type WorkshopCard,
} from "@/lib/workshop/card-tree";
import { loadSession, saveSession, type WorkshopSession } from "@/lib/workshop/session";
import { BrainstormCoachPanel } from "./brainstorm-coach-panel";
import { CardGrid } from "./card-grid";
import { IntuitionInspectPanel } from "./intuition-inspect-panel";

export function RefineFlow() {
  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [level, setLevel] = useState<CardLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [graphInspect, setGraphInspect] = useState<GraphInspectResult | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [activeNetwork, setActiveNetwork] = useState<"testnet" | "mainnet">("testnet");
  const [coach, setCoach] = useState<BrainstormCoach | null>(null);
  const [coachSource, setCoachSource] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);

  const ideaTitle =
    session?.catalogTitle?.trim() ||
    session?.rawIntent.trim().slice(0, 80) ||
    "";

  const fetchInspect = useCallback(async (s: WorkshopSession) => {
    setInspectLoading(true);
    const title =
      s.catalogTitle?.trim() || s.rawIntent.trim().slice(0, 80) || "New Idea";
    try {
      const res = await fetch("/api/intuition/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawIntent: s.rawIntent,
          ideaTitle: title,
          canonicalId: s.catalogCanonicalId,
        }),
      });
      const data = await res.json();
      if (data.networks) setGraphInspect(data as GraphInspectResult);
    } finally {
      setInspectLoading(false);
    }
  }, []);

  const fetchCoach = useCallback(
    async (s: WorkshopSession, question?: string) => {
      setCoachLoading(true);
      const title =
        s.catalogTitle?.trim() || s.rawIntent.trim().slice(0, 80) || "New Idea";
      try {
        const res = await fetch("/api/assist/brainstorm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawIntent: s.rawIntent,
            refinementSummary: s.refinementSummary || s.rawIntent,
            ideaTitle: title,
            canonicalId: s.catalogCanonicalId,
            picks: s.picks,
            currentLevelQuestion: question,
          }),
        });
        const data = await res.json();
        if (data.coach) {
          setCoach(data.coach);
          setCoachSource(data.source);
          if (data.graphInspect) setGraphInspect(data.graphInspect);
        }
      } finally {
        setCoachLoading(false);
      }
    },
    [],
  );

  const fetchLevel = useCallback(async (picks: CardPick[]) => {
    const res = await fetch("/api/workshop/level", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ picks }),
    });
    const data = await res.json();
    if (data.complete) {
      setLevel(null);
      return { complete: true as const, level: null };
    }
    const nextLevel = data.level as CardLevel;
    setLevel(nextLevel);
    return { complete: false as const, level: nextLevel };
  }, []);

  useEffect(() => {
    const stored = loadSession();
    if (!stored?.rawIntent?.trim()) {
      setLoading(false);
      return;
    }
    setSession(stored);
    void Promise.all([
      fetchLevel(stored.picks),
      fetchInspect(stored),
      fetchCoach(stored),
    ]).finally(() => setLoading(false));
  }, [fetchLevel, fetchInspect, fetchCoach]);

  async function handlePick(card: WorkshopCard) {
    if (!session || !level) return;
    setPicking(true);
    const pick: CardPick = { levelId: level.id, cardId: card.id, title: card.title };
    const picks = [...session.picks, pick];
    const next = {
      ...session,
      picks,
      refinementSummary: buildRefinementSummary(session.rawIntent, picks),
    };
    saveSession(next);
    setSession(next);

    if (isRefinementComplete(picks)) {
      setLevel(null);
      void fetchCoach(next);
      setPicking(false);
      return;
    }

    const { level: nextLevel } = await fetchLevel(picks);
    void fetchCoach(next, nextLevel?.question);
    setPicking(false);
  }

  if (loading) {
    return <p className="text-[var(--muted)]">Chargement…</p>;
  }

  if (!session?.rawIntent?.trim()) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <p className="text-[var(--muted)]">Aucune idée en session.</p>
        <Link href="/workshop" className="mt-4 inline-block text-[var(--accent)]">
          ← Commencer l&apos;atelier
        </Link>
      </div>
    );
  }

  const done = isRefinementComplete(session.picks);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <header className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs text-[var(--accent)]">Ton idée</p>
            <p className="text-sm leading-relaxed">{session.rawIntent}</p>
            {session.catalogTitle && (
              <p className="text-xs text-[var(--muted)]">Catalogue : {session.catalogTitle}</p>
            )}
            {session.picks.length > 0 && (
              <p className="text-xs text-[var(--muted)]">
                Chemin : {session.picks.map((p) => p.title).join(" → ")}
              </p>
            )}
          </header>

          {!done && level && (
            <CardGrid
              level={level}
              depth={session.picks.length}
              maxDepth={MAX_CARD_DEPTH}
              onPick={handlePick}
              disabled={picking}
            />
          )}

          {done && (
            <div className="space-y-4 rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-6">
              <h2 className="text-lg font-semibold text-emerald-300">Affinage terminé</h2>
              <p className="text-sm text-[var(--muted)] whitespace-pre-wrap">
                {session.refinementSummary}
              </p>
              <Link
                href="/workshop/brainstorm"
                className="inline-block rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black"
              >
                Structurer en triples →
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <BrainstormCoachPanel
            coach={coach}
            loading={coachLoading}
            source={coachSource}
            onRefresh={() => void fetchCoach(session, level?.question)}
          />
          <IntuitionInspectPanel
            data={graphInspect}
            loading={inspectLoading}
            activeNetwork={activeNetwork}
            onNetworkChange={setActiveNetwork}
          />
        </div>
      </div>

      <Link href="/workshop" className="text-sm text-[var(--muted)] hover:text-white">
        ← Modifier l&apos;idée de départ
      </Link>
    </div>
  );
}
