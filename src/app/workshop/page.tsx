// src/app/workshop/page.tsx
import Link from "next/link";
import { IntentForm } from "@/components/workshop/intent-form";

export default function WorkshopPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-[var(--accent)]">
          Ideation workshop
        </p>
        <h1 className="text-3xl font-bold">Brainstorm → build → publish</h1>
        <p className="max-w-2xl text-[var(--muted)]">
          No fixed idea required. Explore a territory, pick one of five coherent directions,
          deepen it into a product brief, then publish on the Intuition graph.
        </p>
      </section>

      <IntentForm />

      <section className="grid gap-4 border-t border-[var(--border)] pt-8 sm:grid-cols-2">
        <Link
          href="/random?workshop=1"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Random idea</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Start from 300+ catalog ideas</p>
        </Link>
        <Link
          href="/ideas"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Catalog</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Pick a specific entry</p>
        </Link>
      </section>
    </div>
  );
}
