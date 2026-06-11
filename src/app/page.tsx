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
          Project ideas, attested onchain
        </h1>
        <p className="max-w-2xl text-[var(--muted)]">
          Catalog from <em>Build on Intuition: 300+ dApp Ideas</em> — random pick, AI brainstorm,
          GitHub PR and on-chain publish.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/ideas"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Catalog</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {ideas.length} projects · filter by category
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
            Intuition Portal — graph and claims
          </p>
        </a>
        <Link
          href="/pick"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Cards</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Intent → questions → refined mini-cards
          </p>
        </Link>
        <Link
          href="/random"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Random</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            On-chain state · brainstorm · prepare
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
            AI-assisted draft — problem, Intuition fit, semantic linter
          </p>
        </Link>
        <Link
          href="/prepare"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Prepare</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            GitHub PR + on-chain atom and core triple
          </p>
        </Link>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold">Advanced workshop</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Deep research and PR-only flow without on-chain publish from the workshop UI.
        </p>
        <Link
          href="/workshop"
          className="mt-4 inline-block rounded-lg border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10"
        >
          Open workshop
        </Link>
      </section>
    </div>
  );
}
