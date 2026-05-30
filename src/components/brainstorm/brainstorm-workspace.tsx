// src/components/brainstorm/brainstorm-workspace.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Idea } from "@/lib/ideas/schema";
import type { SimilarityResult } from "@/lib/ideas/brainstorm-similarity";
import {
  buildMarkdownPreview,
  buildSemanticDraft,
  defaultDraft,
  draftStorageKey,
  runSemanticLints,
  type BrainstormCanvas,
  type BrainstormDraft,
} from "@/lib/ideas/brainstorm-session";
import { FramingCanvas } from "./framing-canvas";
import { PublishPreview } from "./publish-preview";
import { SemanticAssistant } from "./semantic-assistant";
import { SimilarityRail } from "./similarity-rail";

interface BrainstormWorkspaceProps {
  idea: Idea;
  isFreeIdea?: boolean;
}

interface PreflightResponse {
  subjectExists: boolean;
  predicateExists: boolean;
  objectExists: boolean;
  tripleExists: boolean;
  predictedTripleId: string | null;
  canonical: {
    subject: string | null;
    predicate: string | null;
    object: string | null;
  };
}

function migrateLegacyDraft(raw: unknown, idea: Idea): BrainstormDraft {
  if (!raw || typeof raw !== "object") {
    return defaultDraft({ refinedPitch: idea.tagline });
  }

  const obj = raw as Record<string, unknown>;
  if (obj.version === 2 && obj.canvas) {
    return obj as unknown as BrainstormDraft;
  }

  return defaultDraft({
    refinedPitch: String(obj.problem ?? idea.tagline).slice(0, 300),
    canvas: {
      problem: String(obj.problem ?? ""),
      mainActor: String(obj.users ?? ""),
      attestedObject: String(obj.solution ?? "").slice(0, 200),
      proofMechanism: String(obj.mvp ?? ""),
      signalRole: String(obj.intuitionFit ?? ""),
      challengeForm: "",
    },
  });
}

export function BrainstormWorkspace({
  idea,
  isFreeIdea = false,
}: BrainstormWorkspaceProps) {
  const [draft, setDraft] = useState<BrainstormDraft>(() =>
    defaultDraft({ refinedPitch: idea.tagline }),
  );
  const [saved, setSaved] = useState(false);
  const [similar, setSimilar] = useState<SimilarityResult | null>(null);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [preflight, setPreflight] = useState<PreflightResponse | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(draftStorageKey(idea.slug));
    if (!raw) return;
    try {
      setDraft(migrateLegacyDraft(JSON.parse(raw), idea));
    } catch {
      /* ignore */
    }
  }, [idea]);

  const semantic = useMemo(
    () => buildSemanticDraft(idea.title, draft.canvas),
    [idea.title, draft.canvas],
  );

  const lints = useMemo(
    () =>
      runSemanticLints(semantic, {
        subjectExists: preflight?.subjectExists ?? false,
        predicateExists: preflight?.predicateExists ?? false,
        objectExists: preflight?.objectExists ?? false,
        tripleExists: preflight?.tripleExists ?? false,
      }),
    [semantic, preflight],
  );

  const markdown = useMemo(
    () => buildMarkdownPreview(idea.title, idea.tagline, draft, semantic),
    [idea.title, idea.tagline, draft, semantic],
  );

  const searchQuery = draft.refinedPitch.trim() || idea.title;

  const fetchSimilar = useCallback(async () => {
    if (searchQuery.length < 2) return;
    setSimilarLoading(true);
    try {
      const params = new URLSearchParams({ q: searchQuery });
      if (!isFreeIdea) params.set("slug", idea.slug);
      const res = await fetch(`/api/brainstorm/similar?${params}`);
      if (res.ok) {
        setSimilar((await res.json()) as SimilarityResult);
      }
    } finally {
      setSimilarLoading(false);
    }
  }, [searchQuery, idea.slug, isFreeIdea]);

  const fetchPreflight = useCallback(async () => {
    setPreflightLoading(true);
    try {
      const res = await fetch("/api/brainstorm/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: semantic.ideaAtomLabel,
          predicate: semantic.predicate,
          object: semantic.object,
        }),
      });
      if (res.ok) {
        setPreflight((await res.json()) as PreflightResponse);
      }
    } finally {
      setPreflightLoading(false);
    }
  }, [semantic]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchSimilar();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [fetchSimilar]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPreflight();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [fetchPreflight]);

  function updateCanvas(id: keyof BrainstormCanvas, value: string) {
    setDraft((prev) => ({
      ...prev,
      canvas: { ...prev.canvas, [id]: value },
    }));
    setSaved(false);
  }

  function saveDraft() {
    localStorage.setItem(draftStorageKey(idea.slug), JSON.stringify(draft));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      <header className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--accent)]">
              Brainstorm ·{" "}
              {isFreeIdea ? "idée libre" : "brouillon sémantique publiable"}
            </p>
            <h1 className="mt-1 text-xl font-bold">{idea.title}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{idea.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isFreeIdea ? (
              <Link
                href={`/scamper/libre/${idea.slug}`}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:border-[var(--accent)]"
              >
                ← SCAMPER
              </Link>
            ) : (
              <>
                <Link
                  href="/random"
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:border-[var(--accent)]"
                >
                  Idée aléatoire
                </Link>
                <Link
                  href="/pick"
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:border-[var(--accent)]"
                >
                  Retour cartes
                </Link>
              </>
            )}
          </div>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-semibold">Idée libre — formulation synthétique</span>
          <textarea
            className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm focus:border-[var(--accent)] focus:outline-none"
            rows={2}
            placeholder="Pitch en une ou deux phrases — alimente la recherche d'existant…"
            value={draft.refinedPitch}
            onChange={(e) => {
              setDraft((prev) => ({ ...prev, refinedPitch: e.target.value }));
              setSaved(false);
            }}
          />
        </label>
      </header>

      <div className="grid min-h-[520px] gap-4 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <SimilarityRail
            data={similar}
            loading={similarLoading}
            onRefresh={() => void fetchSimilar()}
          />
        </div>

        <div className="lg:col-span-6">
          <FramingCanvas
            archetype={draft.archetype}
            canvas={draft.canvas}
            onArchetypeChange={(id) => {
              setDraft((prev) => ({ ...prev, archetype: id }));
              setSaved(false);
            }}
            onCanvasChange={updateCanvas}
          />
        </div>

        <div className="lg:col-span-3">
          <SemanticAssistant
            semantic={semantic}
            lints={lints}
            preflight={preflight}
            loading={preflightLoading}
          />
        </div>
      </div>

      <PublishPreview
        markdown={markdown}
        slug={idea.slug}
        isFreeIdea={isFreeIdea}
        onSave={saveDraft}
        saved={saved}
      />
    </div>
  );
}
