// src/app/page.tsx
import Link from "next/link";
import { HunchGlyph } from "@/components/brand/hunch-logo";
import { getNetworkConfig, getPortalExplorerUrl } from "@/lib/intuition/config";
import { loadCatalogIdeas } from "@/lib/ideas/load-catalog";

const ENTRY_PATHS = [
  {
    title: "Start from a catalog card",
    description:
      "Browse ideas already attested on the Intuition graph. Pick one that resonates, then reshape it — the AI helps you improve the concept, not copy it.",
    bullets: [
      "Browse by category or draw a random card",
      "See GitHub and on-chain status before you commit",
      "Fork the narrative: problem, solution, MVP, Intuition fit",
    ],
    href: "/ideas",
    cta: "Browse catalog →",
    accent: false,
  },
  {
    title: "Create your own idea",
    description:
      "Describe a hunch in your own words. The app checks for similar ideas for inspiration, then guides you through a free-form brainstorm — no card required.",
    bullets: [
      "Start from /brainstorm with “Start without catalog”",
      "Five guided questions + AI synthesis into a draft",
      "Duplicate check before any on-chain step",
    ],
    href: "/brainstorm#free-form",
    cta: "Start from scratch →",
    accent: true,
  },
];

const FLOW = [
  {
    phase: "Ideate",
    title: "Describe & explore",
    text: "Share a rough hunch or open a catalog card. Nearby ideas surface for context — inspiration only, never a substitute for your own angle.",
  },
  {
    phase: "Structure",
    title: "Brainstorm with AI",
    text: "Answer five ideation prompts (problem, users, solution, MVP, Intuition fit). AI synthesizes your answers into a structured draft — you stay in control.",
  },
  {
    phase: "Stress-test",
    title: "Challenge",
    text: "AI plays devil’s advocate: main objection, counter-direction, killer assumptions, and protocol feasibility. Fix gaps before you publish.",
  },
  {
    phase: "Share",
    title: "Open a GitHub PR",
    text: "Sign in with GitHub. The app forks intuition-box/ideas, opens a branch, and creates a pull request with your idea markdown — ready for community review.",
  },
  {
    phase: "Attest",
    title: "Publish on-chain",
    text: "Connect your wallet. Create an atom for your idea and a core triple linking it to the Intuition ecosystem — verifiable on the knowledge graph.",
  },
];

export default async function HomePage() {
  const catalog = await loadCatalogIdeas();
  const ideaCount = catalog.ideas.length;
  const networkConfig = getNetworkConfig();
  const portalUrl = getPortalExplorerUrl(networkConfig.network);

  return (
    <div className="space-y-24 pb-16">
      {/* Hero */}
      <section className="flex flex-col items-center pt-16 text-center">
        <HunchGlyph size={72} />
        <h1 className="mt-8 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          Every idea starts
          <br />
          as a <span className="text-[var(--accent)]">hunch</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted)] md:text-lg">
          Hunch is an ideation workspace for the Intuition ecosystem. Improve an
          existing catalog idea or invent your own — then challenge it with AI,
          open a GitHub PR, and attest it on-chain.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/brainstorm#free-form"
            className="neon-btn rounded-lg px-6 py-3 text-sm font-medium"
          >
            Start brainstorming →
          </Link>
          <Link
            href="/ideas"
            className="neon-btn-ghost rounded-lg px-6 py-3 text-sm"
          >
            Browse catalog
          </Link>
        </div>
        <p className="mt-8 text-xs uppercase tracking-widest text-[var(--muted)]">
          <span className="text-[var(--accent)]">{ideaCount} ideas</span> in the
          catalog · {networkConfig.network} · powered by Intuition
        </p>
      </section>

      {/* Two entry paths */}
      <section className="space-y-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
            Choose your starting point
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Two ways into the same flow
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--muted)]">
            Both paths converge: brainstorm → challenge → GitHub PR → on-chain
            attestation.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {ENTRY_PATHS.map((path) => (
            <div
              key={path.title}
              className={`neon-card flex flex-col rounded-2xl p-6 md:p-8 ${
                path.accent ? "neon-card-active" : ""
              }`}
            >
              <h3 className="text-lg font-semibold">{path.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {path.description}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-[var(--muted)]">
                {path.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="text-[var(--cyan-bright)]">·</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={path.href}
                className={`mt-6 inline-block w-fit rounded-lg px-5 py-2.5 text-sm font-medium ${
                  path.accent ? "neon-btn" : "neon-btn-ghost"
                }`}
              >
                {path.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Full flow */}
      <section className="space-y-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
            End-to-end journey
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            From hunch to attestation
          </h2>
        </div>
        <ol className="relative space-y-0">
          {FLOW.map((step, index) => (
            <li
              key={step.title}
              className="relative grid gap-4 pb-10 md:grid-cols-[7rem_1fr] md:gap-8 md:pb-12 last:pb-0"
            >
              {index < FLOW.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[3.25rem] top-10 hidden h-[calc(100%-2rem)] w-px bg-[var(--border)] md:block"
                />
              )}
              <div className="flex items-start gap-4 md:flex-col md:items-end md:gap-2 md:pt-1 md:text-right">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--background)] font-mono text-xs text-[var(--accent)] md:ml-auto">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-xs uppercase tracking-widest text-[var(--accent)]">
                  {step.phase}
                </span>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 md:-mt-1">
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            href="/brainstorm"
            className="neon-btn rounded-lg px-6 py-3 text-sm font-medium"
          >
            Enter the flow →
          </Link>
          <Link
            href="/random"
            className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm text-[var(--foreground)] transition hover:border-[var(--accent)]"
          >
            Try a random card
          </Link>
        </div>
      </section>

      {/* On-chain explainer */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 md:p-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
              What “publish on-chain” means
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Your idea becomes an atom on the graph.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              After the GitHub PR, you can attest the idea on Intuition. An{" "}
              <strong className="text-[var(--foreground)]">atom</strong> is the
              on-chain identity of your concept. A{" "}
              <strong className="text-[var(--foreground)]">triple</strong> links
              it to the ecosystem — typically{" "}
              <em>[Your idea] → top project ideas for → Intuition</em>. Community
              staking then signals conviction. Your hunch becomes a discoverable,
              verifiable knowledge asset.
            </p>
            <p className="mt-4 text-sm text-[var(--muted)]">
              GitHub = human-readable proposal. On-chain = durable attestation
              anyone can query via GraphQL.
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

      {/* Quick links */}
      <section className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/ideas"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h3 className="font-semibold">Catalog</h3>
          <p className="mt-2 text-[var(--muted)]">
            {ideaCount} ideas by category — pick one to improve.
          </p>
        </Link>
        <Link
          href="/brainstorm#free-form"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h3 className="font-semibold">Free-form brainstorm</h3>
          <p className="mt-2 text-[var(--muted)]">
            Describe your hunch — no catalog card needed.
          </p>
        </Link>
        <Link
          href="/random"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h3 className="font-semibold">Random idea</h3>
          <p className="mt-2 text-[var(--muted)]">
            One card from the on-chain list, with status checks.
          </p>
        </Link>
        <a
          href={portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h3 className="font-semibold">Intuition Portal ↗</h3>
          <p className="mt-2 text-[var(--muted)]">
            Explore atoms, triples, and signals on {networkConfig.network}.
          </p>
        </a>
      </section>
    </div>
  );
}
