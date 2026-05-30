// src/app/brainstorm/page.tsx
import Link from "next/link";

export default function BrainstormIndexPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="text-xs uppercase tracking-wide text-[var(--accent)]">
          Workspace brainstorm
        </p>
        <h1 className="mt-1 text-2xl font-bold">Brainstorm</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Workspace à quatre zones : recherche d&apos;existant, canvas de cadrage,
          assistant sémantique et prévisualisation de publication — pour passer
          d&apos;une idée vague à un brouillon compatible graphe Intuition.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/pick"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Depuis les cartes</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Intent → questions → choisir une idée
          </p>
        </Link>
        <Link
          href="/ideas"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Catalogue</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Ouvrir une fiche puis Brainstorm
          </p>
        </Link>
        <Link
          href="/random"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Idée aléatoire</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Point de départ libre
          </p>
        </Link>
      </div>
    </div>
  );
}
