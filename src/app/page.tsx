// src/app/page.tsx
import Link from "next/link";
import { loadNormalizedIdeas } from "@/lib/ideas/load";

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
          Parcourez un catalogue de concepts dApp, consultez leurs métadonnées et
          explorez les claims sur le graphe de connaissances Intuition — le tout
          depuis une interface dédiée.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Catalogue",
            body: "Liste filtrable par catégorie, fiche détaillée et statut onchain.",
            href: "/ideas",
          },
          {
            title: "Explorer",
            body: "Claims indexés + accès au Portal Intuition pour le graphe visuel.",
            href: "/graph",
          },
          {
            title: "Découvrir",
            body: "Tirez une idée au hasard pour explorer le catalogue.",
            href: "/random",
          },
        ].map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
          >
            <h2 className="font-semibold">{card.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{card.body}</p>
          </Link>
        ))}
      </section>

      {ideas.length > 0 ? (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-sm text-[var(--muted)]">
            <span className="text-2xl font-bold text-white">{ideas.length}</span>{" "}
            projets indexés dans le catalogue local.
          </p>
        </section>
      ) : null}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold">Comment ça marche</h2>
        <ol className="mt-3 list-inside list-decimal space-y-1 text-sm text-[var(--muted)]">
          <li>Chaque projet est un atom Intuition avec métadonnées IPFS</li>
          <li>
            Une attestation relie le projet à Intuition Protocol via le prédicat{" "}
            <em>top project ideas for</em>
          </li>
          <li>Le Portal permet d’explorer, staker et parcourir le graphe</li>
        </ol>
      </section>
    </div>
  );
}
