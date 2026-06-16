// src/app/page.tsx
import Link from "next/link";
import { HunchGlyph } from "@/components/brand/hunch-logo";
import { loadNormalizedIdeas } from "@/lib/ideas/load";

const PORTAL_EXPLORER_URL =
  "https://testnet.portal.intuition.systems/explore/home";

const STEPS = [
  {
    n: "01",
    title: "Décrire",
    text: "Racontez votre idée en quelques phrases — un pressentiment suffit.",
  },
  {
    n: "02",
    title: "Explorer",
    text: "Le catalogue onchain révèle les idées proches, comme inspiration, jamais comme substitut.",
  },
  {
    n: "03",
    title: "Brainstormer",
    text: "Cinq questions d'idéation élargissent votre concept ; l'IA synthétise sans le remplacer.",
  },
  {
    n: "04",
    title: "Challenger",
    text: "Objection principale, contre-direction, hypothèses tueuses — le stress test avant de construire.",
  },
  {
    n: "05",
    title: "Publier",
    text: "PR GitHub sur intuition-box/ideas, puis atom et triple attestés sur le graphe Intuition.",
  },
];

export default function HomePage() {
  const ideaCount = loadNormalizedIdeas().length;

  return (
    <div className="space-y-24 pb-16">
      <section className="flex flex-col items-center pt-16 text-center">
        <HunchGlyph size={72} />
        <h1 className="mt-8 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          Every idea starts
          <br />
          as a <span className="text-[var(--accent)]">hunch</span>.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--muted)] md:text-lg">
          Hunch transforme une intuition brute en idée structurée — explorée,
          challengée par l&apos;IA, publiée sur GitHub et attestée onchain sur le
          graphe Intuition.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/brainstorm"
            className="rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-medium text-black transition hover:bg-white"
          >
            Lancer un brainstorm →
          </Link>
          <Link
            href="/ideas"
            className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm text-[var(--foreground)] transition hover:border-[var(--accent)]"
          >
            Explorer le catalogue
          </Link>
        </div>
        <p className="mt-8 text-xs uppercase tracking-widest text-[var(--muted)]">
          <span className="text-[var(--accent)]">{ideaCount} idées</span> attestées
          onchain · powered by Intuition
        </p>
      </section>

      <section className="space-y-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
            Le parcours
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            De l&apos;intuition à l&apos;attestation
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <p className="font-mono text-xs text-[var(--accent)]">{step.n}</p>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 md:p-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
              Pourquoi onchain ?
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Une idée publiée devient un atom.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              Chaque idée aboutie est attestée sur le graphe de connaissances
              Intuition : un <strong className="text-[var(--foreground)]">atom</strong>{" "}
              identifie l&apos;idée, un{" "}
              <strong className="text-[var(--foreground)]">triple</strong> la relie à
              l&apos;écosystème, et le <em>staking</em> de la communauté mesure la
              conviction. Votre intuition devient un actif de connaissance —
              vérifiable, découvrable, vivant.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 font-mono text-xs leading-loose text-[var(--muted)]">
            <p>
              <span className="text-[var(--accent)]">[Votre idée]</span>
            </p>
            <p className="pl-4">— top project ideas for —</p>
            <p className="pl-8">
              <span className="text-[var(--foreground)]">[Intuition]</span>
            </p>
            <p className="mt-3 border-t border-[var(--border)] pt-3">
              atom ✓ &nbsp; triple ✓ &nbsp; queryable via GraphQL ✓
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 text-sm sm:grid-cols-3">
        <Link
          href="/random"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h3 className="font-semibold">Idée aléatoire</h3>
          <p className="mt-2 text-[var(--muted)]">
            Piochez dans la liste onchain, état GitHub et graphe vérifié.
          </p>
        </Link>
        <Link
          href="/brainstorm"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h3 className="font-semibold">Brainstorm</h3>
          <p className="mt-2 text-[var(--muted)]">
            Idée libre avec IA ou parcours thème → idées populaires → vérif
            doublon avant atom.
          </p>
        </Link>
        <a
          href={PORTAL_EXPLORER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h3 className="font-semibold">Portal Intuition ↗</h3>
          <p className="mt-2 text-[var(--muted)]">
            Explorez les atoms, triples et signaux sur le graphe testnet.
          </p>
        </a>
      </section>
    </div>
  );
}
