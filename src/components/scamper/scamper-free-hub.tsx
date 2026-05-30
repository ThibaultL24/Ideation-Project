// src/components/scamper/scamper-free-hub.tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createFreeIdea,
  deleteFreeIdea,
  listFreeIdeas,
  type FreeIdea,
} from "@/lib/ideas/free-idea";

export function ScamperFreeHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<FreeIdea[]>([]);

  useEffect(() => {
    const intent = searchParams.get("intent")?.trim();
    if (intent) setTagline(intent);
  }, [searchParams]);

  useEffect(() => {
    setSessions(listFreeIdeas());
  }, []);

  function refreshList() {
    setSessions(listFreeIdeas());
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const idea = createFreeIdea({ title, tagline, description });
      refreshList();
      router.push(`/scamper/libre/${idea.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  function handleDelete(id: string) {
    if (!window.confirm("Supprimer cette idée libre et ses brouillons ?")) return;
    deleteFreeIdea(id);
    refreshList();
  }

  return (
    <div className="space-y-8">
      <header className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="text-xs uppercase tracking-wide text-[var(--accent)]">
          SCAMPER · idée libre
        </p>
        <h1 className="mt-1 text-2xl font-bold">Développer votre propre idée</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Sans passer par le catalogue. Vous définissez le concept, puis SCAMPER
          vous guide pour l&apos;approfondir — avant Brainstorm et publication.
        </p>
      </header>

      <form
        onSubmit={handleCreate}
        className="space-y-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--card)] p-5"
      >
        <h2 className="font-semibold">Nouvelle idée</h2>
        <label className="block">
          <span className="text-sm font-semibold">Titre du projet</span>
          <input
            className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm focus:border-[var(--accent)] focus:outline-none"
            placeholder="Ex. TrustLens pour modèles IA"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={2}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Pitch (une phrase)</span>
          <textarea
            className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm focus:border-[var(--accent)] focus:outline-none"
            rows={2}
            placeholder="Ce que fait le produit et pour qui…"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            required
            minLength={5}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">
            Description (optionnel)
          </span>
          <textarea
            className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm focus:border-[var(--accent)] focus:outline-none"
            rows={4}
            placeholder="Problème, solution, angle Intuition…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
        >
          Lancer SCAMPER sur cette idée →
        </button>
      </form>

      {sessions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-semibold">Vos idées libres en cours</h2>
          <ul className="space-y-2">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{session.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                    {session.tagline}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    Modifié{" "}
                    {new Date(session.updatedAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/scamper/libre/${session.id}`}
                    className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-black"
                  >
                    Reprendre
                  </Link>
                  <Link
                    href={`/brainstorm/libre/${session.id}`}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:border-[var(--accent)]"
                  >
                    Brainstorm
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(session.id)}
                    className="rounded-lg border border-red-900/50 px-3 py-1.5 text-sm text-red-300 hover:border-red-500"
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/scamper" className="text-[var(--accent)] hover:underline">
          ← SCAMPER (catalogue)
        </Link>
        <Link href="/pick" className="text-[var(--muted)] hover:underline">
          Cartes
        </Link>
      </div>
    </div>
  );
}
