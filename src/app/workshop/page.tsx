// src/app/workshop/page.tsx
import Link from "next/link";
import { IntentForm } from "@/components/workshop/intent-form";

export default function WorkshopPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-[var(--accent)]">
          Atelier idéation v2
        </p>
        <h1 className="text-3xl font-bold">Affine ton idée, puis structure-la en triples</h1>
        <p className="max-w-2xl text-[var(--muted)]">
          Trois tours de cartes pour préciser le modèle produit, puis un assistant IA qui
          propose atoms, triples de soutien et triples imbriqués (provenance) — avec linter
          protocole Intuition.
        </p>
      </section>

      <IntentForm />

      <section className="grid gap-4 border-t border-[var(--border)] pt-8 sm:grid-cols-2">
        <Link
          href="/random?workshop=1"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Idée au hasard</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Partir du catalogue 300+ idées</p>
        </Link>
        <Link
          href="/ideas"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--accent)]"
        >
          <h2 className="font-semibold">Catalogue</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Choisir une fiche précise</p>
        </Link>
      </section>
    </div>
  );
}
