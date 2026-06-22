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
      setError("Describe your idea in at least 3 characters.");
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
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
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
        The most supported ideas appear as cards. If yours is not there, describe it
        here: we check for a nearby atom before letting you create a new one.
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">
            What do you want to build in &ldquo;{category}&rdquo;?
          </span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="E.g. a reputation app for music teachers…"
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {loading ? "Checking…" : "Check for similarities"}
        </button>
      </form>

      {result ? (
        <div className="space-y-4">
          {blocked ? (
            <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
              A very similar atom or catalog idea already exists. Pick it or rephrase
              your prompt — no new atom for now.
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
              Nothing similar found — you can structure your idea.
            </div>
          )}

          {result.catalogMatches.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold">Nearby catalog ideas</h2>
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
              <h2 className="text-sm font-semibold">Nearby atoms (graph)</h2>
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
              Structure my idea →
            </Link>
          ) : null}
        </div>
      ) : null}

      <Link
        href={`/brainstorm/category/${categorySlug}`}
        className="text-sm text-[var(--accent)] hover:underline"
      >
        ← Back to category
      </Link>
    </div>
  );
}
