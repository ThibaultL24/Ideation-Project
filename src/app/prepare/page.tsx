// src/app/prepare/page.tsx
import Link from "next/link";

export default function PrepareIndexPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Prepare & Publish</h1>
      <p className="text-[var(--muted)]">
        Après le brainstorm : vérifiez scoped / onchain / PR, formalisez le
        triple cœur, puis publiez sur GitHub et Intuition testnet.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/pick"
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-black transition hover:bg-white"
        >
          Choisir une carte
        </Link>
        <Link
          href="/brainstorm"
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          Brainstorm
        </Link>
      </div>
    </div>
  );
}
