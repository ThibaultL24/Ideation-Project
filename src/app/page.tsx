// src/app/page.tsx
import Link from "next/link";
import { loadNormalizedIdeas } from "@/lib/ideas/load";

const PORTAL_EXPLORER_URL =
  "https://testnet.portal.intuition.systems/explore/home";

export default function HomePage() {
  const ideas = loadNormalizedIdeas();

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-widest text-[var(--accent)]">
          Intuition · testnet
        </p>
        <h1 className="text-3xl font-bold leading-tight md:text-4xl">
          Idées de projets, attestées onchain
        </h1>
        <p className="max-w-2xl text-[var(--muted)]">
          Catalogue issu du document <em>Build on Intuition: 300+ dApp Ideas</em> —
          chaque fiche reprend le texte source du PDF.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/ideas"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Catalogue</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {ideas.length} projets · filtres par catégorie
          </p>
        </Link>
        <a
          href={PORTAL_EXPLORER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Explorer</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Portal Intuition — graphe et claims
          </p>
        </a>
        <Link
          href="/pick"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Cartes</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Intent → questions → mini-cartes affinées
          </p>
        </Link>
        <Link
          href="/random"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Aléatoire</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Une idée au hasard
          </p>
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/brainstorm"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Brainstorm</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Affiner l&apos;idée — problème, solution, fit Intuition
          </p>
        </Link>
        <Link
          href="/prepare"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Prepare</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Existant, triple cœur, publication GitHub + onchain
          </p>
        </Link>
      </section>
    </div>
  );
}
