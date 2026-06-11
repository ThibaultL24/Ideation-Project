// src/app/brainstorm/page.tsx
import Link from "next/link";

export default function BrainstormIndexPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Brainstorm</h1>
      <p className="text-[var(--muted)]">
        Choisissez une idée via les cartes ou le catalogue, puis affinez le
        concept (problème, solution, Intuition fit) avant la préparation onchain.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/pick"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
        >
          Tirer des cartes
        </Link>
        <Link
          href="/ideas"
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          Catalogue
        </Link>
      </div>
    </div>
  );
}
