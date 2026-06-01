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
          Catalog from <em>Build on Intuition: 300+ dApp Ideas</em> — each entry
          mirrors the source PDF text.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
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
          href="/random"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Discover</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Random idea</p>
        </Link>
      </section>

      <section className="rounded-xl border border-[var(--accent)]/30 bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold">Ideation workshop</h2>
        <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
          Deep research on your idea, then Intuition triples and a GitHub PR — no
          on-chain transactions from this app.
        </p>
        <Link
          href="/workshop"
          className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
        >
          Open workshop
        </Link>
      </section>
    </div>
  );
}
