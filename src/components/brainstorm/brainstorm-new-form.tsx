// src/components/brainstorm/brainstorm-new-form.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import type { SimilarSearchResult } from "@/lib/ideas/brainstorm-similarity";
import { categoryToSlug } from "@/lib/ideas/category";

interface BrainstormNewFormProps {
  category: string;
}

export function BrainstormNewForm({ category }: BrainstormNewFormProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimilarSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categorySlug = categoryToSlug(category);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (prompt.trim().length < 3) {
      setError("Décrivez votre idée en au moins 3 caractères.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/brainstorm/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), category }),
      });
      const data = (await res.json()) as SimilarSearchResult & {
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Erreur de vérification");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  const blocked = Boolean(result?.hasStrongMatch);

  const continueHref = `/brainstorm/new/continue?${new URLSearchParams({
    prompt: prompt.trim(),
    category,
  }).toString()}`;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted)]">
        Les idées les plus soutenues apparaissent en cartes. Si la vôtre n’y est
        pas, décrivez-la ici : nous vérifions s’il existe déjà un atom proche
        avant de vous laisser en créer un nouveau.
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">
            Que voulez-vous créer dans « {category} » ?
          </span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Ex. une app de réputation pour les profs de musique…"
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {loading ? "Vérification…" : "Vérifier les similarités"}
        </button>
      </form>

      {result ? (
        <div className="space-y-4">
          {blocked ? (
            <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
              Un atom ou une idée catalogue très proche existe déjà. Choisissez-la
              ou reformulez votre prompt — pas de nouvel atom pour l’instant.
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
              Rien de similaire trouvé — vous pouvez structurer votre idée.
            </div>
          )}

          {result.catalogMatches.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold">Idées catalogue proches</h2>
              <ul className="mt-2 space-y-2">
                {result.catalogMatches.map((m) => (
                  <li key={m.idea.slug}>
                    <Link
                      href={`/brainstorm/category/${categorySlug}/${m.idea.slug}`}
                      className="block rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 hover:border-[var(--accent)]"
                    >
                      <span className="font-medium">{m.idea.title}</span>
                      <span className="ml-2 text-xs text-[var(--muted)]">
                        score {m.score}
                        {m.state.onchain?.atomInIndexer ? " · onchain" : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {result.graphMatches.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold">Atoms proches (graphe)</h2>
              <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
                {result.graphMatches.map((a) => (
                  <li key={a.term_id} className="font-mono text-xs">
                    {a.label} · {a.term_id.slice(0, 14)}…
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {!blocked ? (
            <Link
              href={continueHref}
              className="inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
            >
              Structurer mon idée →
            </Link>
          ) : null}
        </div>
      ) : null}

      <Link
        href={`/brainstorm/category/${categorySlug}`}
        className="text-sm text-[var(--accent)] hover:underline"
      >
        ← Retour à la catégorie
      </Link>
    </div>
  );
}
