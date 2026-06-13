// src/components/pick/pick-flow.tsx
"use client";

import { useCallback, useState } from "react";
import type {
  PickAnswer,
  PickQuestion,
  PickRefineResponse,
} from "@/lib/ideas/pick-refinement";
import type { IdeaFullState } from "@/lib/ideas/idea-state";
import { IdeaCard } from "./idea-card";
import { IdeaStatePanel } from "./idea-state-panel";
import { RefinementQuestion } from "./refinement-question";

interface DetailResponse {
  state: IdeaFullState;
  prompt: string;
  idea: { github?: { prUrl?: string } };
}

type Phase = "intent" | "refine" | "done";

export function PickFlow() {
  const [phase, setPhase] = useState<Phase>("intent");
  const [intent, setIntent] = useState("");
  const [answers, setAnswers] = useState<PickAnswer[]>([]);
  const [excludeSlugs, setExcludeSlugs] = useState<string[]>([]);
  const [focusSlug, setFocusSlug] = useState<string | undefined>();

  const [refine, setRefine] = useState<PickRefineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const runRefine = useCallback(
    async (
      nextAnswers: PickAnswer[],
      nextExclude: string[],
      nextFocus?: string,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/pick/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent,
            answers: nextAnswers,
            excludeSlugs: nextExclude,
            focusSlug: nextFocus,
          }),
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Erreur de recherche");
        }
        const data = (await res.json()) as PickRefineResponse;
        setRefine(data);
        setAnswers(nextAnswers);
        setExcludeSlugs(nextExclude);
        setFocusSlug(nextFocus);
        return data;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [intent],
  );

  async function startRefinement() {
    if (intent.trim().length < 3) {
      setError("Décrivez votre idée en quelques mots (ex. app IA sur la réputation).");
      return;
    }
    setPhase("refine");
    setSelectedSlug(null);
    setDetail(null);
    await runRefine([], [], undefined);
  }

  async function answerQuestion(choiceId: string, question: PickQuestion) {
    const next: PickAnswer[] = [
      ...answers,
      { questionId: question.id, choiceId },
    ];
    let nextExclude = [...excludeSlugs];
    let nextFocus = focusSlug;

    if (question.id === "card_fit" && choiceId === "not_this" && focusSlug) {
      nextExclude = [...nextExclude, focusSlug];
      nextFocus = undefined;
    }
    if (question.id === "focus_path" && choiceId === "widen") {
      nextFocus = undefined;
    }

    const data = await runRefine(next, nextExclude, nextFocus);
    if (data?.readyToSelect && focusSlug) {
      await confirmSelection(focusSlug);
    }
  }

  async function pickCard(slug: string) {
    const next: PickAnswer[] = [
      ...answers,
      { questionId: "pick_card", choiceId: slug },
    ];
    setFocusSlug(slug);
    const data = await runRefine(next, excludeSlugs, slug);

    if (data?.readyToSelect) {
      await confirmSelection(slug);
      return;
    }

    if (!data?.question) {
      setSelectedSlug(slug);
    }
  }

  async function confirmSelection(slug: string) {
    setSelectedSlug(slug);
    setPhase("done");
    setLoadingDetail(true);
    setDetail(null);
    try {
      const res = await fetch(
        `/api/idea-state/${encodeURIComponent(slug)}?verifyOnchain=true`,
      );
      if (!res.ok) throw new Error("Impossible de charger l'état");
      setDetail((await res.json()) as DetailResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoadingDetail(false);
    }
  }

  function resetAll() {
    setPhase("intent");
    setIntent("");
    setAnswers([]);
    setExcludeSlugs([]);
    setFocusSlug(undefined);
    setRefine(null);
    setSelectedSlug(null);
    setDetail(null);
    setError(null);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Cartes · recherche guidée</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Décrivez votre projet, répondez aux questions — chaque choix affine les
          mini-cartes du catalogue. Ensuite : vérif état,{" "}
          <strong>Brainstorm</strong> et <strong>Prepare</strong>.
        </p>
      </div>

      {phase === "intent" ? (
        <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <label className="block">
            <span className="text-sm font-semibold">Votre idée en une phrase</span>
            <textarea
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 text-sm focus:border-[var(--accent)] focus:outline-none"
              rows={3}
              placeholder="Ex. Je veux créer une app sur l'IA pour la réputation des modèles..."
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={() => void startRefinement()}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-black transition hover:bg-white"
          >
            Affiner avec des questions
          </button>
        </section>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {phase === "refine" && refine ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
            <span>
              {refine.matchCount} idée{refine.matchCount > 1 ? "s" : ""} correspondante
              {refine.matchCount > 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={resetAll}
              className="text-[var(--accent)] hover:underline"
            >
              Recommencer
            </button>
          </div>

          {refine.filtersSummary.length > 0 ? (
            <p className="text-xs text-[var(--muted)]">
              Filtres : {refine.filtersSummary.join(" · ")}
            </p>
          ) : null}

          {refine.question ? (
            <RefinementQuestion
              question={refine.question}
              onChoose={(id) => void answerQuestion(id, refine.question!)}
              disabled={loading}
            />
          ) : null}

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--muted)]">
              Mini-cartes {refine.question ? "(aperçu)" : "— choisissez la plus proche"}
            </h3>
            {loading && refine.cards.length === 0 ? (
              <p className="text-[var(--muted)]">Recherche…</p>
            ) : refine.cards.length === 0 ? (
              <p className="text-[var(--muted)]">
                Aucune carte — élargissez via une réponse ou reformulez l&apos;intention.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {refine.cards.map((card) => (
                  <IdeaCard
                    key={card.slug}
                    state={card}
                    selected={selectedSlug === card.slug || focusSlug === card.slug}
                    onSelect={() => void pickCard(card.slug)}
                  />
                ))}
              </div>
            )}
          </section>

          {refine.readyToSelect && focusSlug && !selectedSlug ? (
            <button
              type="button"
              onClick={() => void confirmSelection(focusSlug)}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-black transition hover:bg-white"
            >
              Continuer avec cette idée →
            </button>
          ) : null}
        </>
      ) : null}

      {phase === "done" && selectedSlug ? (
        <IdeaStatePanel
          state={
            detail?.state ??
            refine?.cards.find((c) => c.slug === selectedSlug) ?? {
              slug: selectedSlug,
              canonicalId: "",
              title: "",
              category: "",
              tagline: "",
              db: {
                scoped: false,
                hasGithubPath: false,
                hasGithubPr: false,
                status: "normalized",
              },
              onchain: null,
              nextAction: "create_with_prompt",
              badges: ["catalogue"],
            }
          }
          prompt={detail?.prompt ?? ""}
          loadingOnchain={loadingDetail}
          githubPrUrl={detail?.idea.github?.prUrl}
        />
      ) : null}
    </div>
  );
}
