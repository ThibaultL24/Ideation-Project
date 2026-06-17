// src/app/page.tsx
import Link from "next/link";
import { HunchGlyph } from "@/components/brand/hunch-logo";
import { loadNormalizedIdeas } from "@/lib/ideas/load";

const PORTAL_EXPLORER_URL =
  "https://testnet.portal.intuition.systems/explore/home";

const STEPS = [
  {
    n: "01",
    title: "Describe",
    text: "Share your idea in a few sentences — a hunch is enough.",
  },
  {
    n: "02",
    title: "Explore",
    text: "The on-chain catalog surfaces nearby ideas for inspiration, never as a substitute.",
  },
  {
    n: "03",
    title: "Brainstorm",
    text: "Five ideation questions expand your concept; AI synthesizes without replacing you.",
  },
  {
    n: "04",
    title: "Challenge",
    text: "Main objection, counter-direction, killer assumptions — stress-test before building.",
  },
  {
    n: "05",
    title: "Publish",
    text: "GitHub PR on intuition-box/ideas, then atom and triple attested on the Intuition graph.",
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
          Hunch turns a raw hunch into a structured idea — explored, challenged by
          AI, published on GitHub, and attested on-chain on the Intuition knowledge
          graph.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/brainstorm"
            className="rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-medium text-black transition hover:bg-white"
          >
            Start brainstorming →
          </Link>
          <Link
            href="/ideas"
            className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm text-[var(--foreground)] transition hover:border-[var(--accent)]"
          >
            Browse catalog
          </Link>
        </div>
        <p className="mt-8 text-xs uppercase tracking-widest text-[var(--muted)]">
          <span className="text-[var(--accent)]">{ideaCount} ideas</span> attested
          on-chain · powered by Intuition
        </p>
      </section>

      <section className="space-y-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
            The journey
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            From hunch to attestation
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
              Why on-chain?
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              A published idea becomes an atom.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              Every mature idea is attested on the Intuition knowledge graph: an{" "}
              <strong className="text-[var(--foreground)]">atom</strong> identifies the
              idea, a <strong className="text-[var(--foreground)]">triple</strong>{" "}
              connects it to the ecosystem, and community{" "}
              <em>staking</em> measures conviction. Your hunch becomes a knowledge
              asset — verifiable, discoverable, alive.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 font-mono text-xs leading-loose text-[var(--muted)]">
            <p>
              <span className="text-[var(--accent)]">[Your idea]</span>
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
          <h3 className="font-semibold">Random idea</h3>
          <p className="mt-2 text-[var(--muted)]">
            Pick from the on-chain list with GitHub and graph status verified.
          </p>
        </Link>
        <Link
          href="/brainstorm"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h3 className="font-semibold">Brainstorm</h3>
          <p className="mt-2 text-[var(--muted)]">
            Free-form AI flow or themed path → popular ideas → duplicate check before
            atom.
          </p>
        </Link>
        <a
          href={PORTAL_EXPLORER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h3 className="font-semibold">Intuition Portal ↗</h3>
          <p className="mt-2 text-[var(--muted)]">
            Explore atoms, triples, and signals on the testnet graph.
          </p>
        </a>
      </section>
    </div>
  );
}
