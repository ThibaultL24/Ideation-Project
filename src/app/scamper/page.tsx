// src/app/scamper/page.tsx
import Link from "next/link";

export default function ScamperIndexPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="text-xs uppercase tracking-wide text-[var(--accent)]">
          S · C · A · M · P · E · R
        </p>
        <h1 className="mt-1 text-2xl font-bold">SCAMPER</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Substituer, Combiner, Adapter, Modifier, Proposer ailleurs, Éliminer,
          Inverser — sept angles pour faire évoluer une idée après les cartes,
          avant le Brainstorm protocolaire.
        </p>
      </header>

      <ol className="grid gap-3 sm:grid-cols-2">
        {[
          ["S", "Substituer", "Remplacer acteur, donnée ou mécanisme"],
          ["C", "Combiner", "Fusionner idées ou patterns Intuition"],
          ["A", "Adapter", "Transposer un tutoriel officiel"],
          ["M", "Modifier", "Amplifier ou réduire le scope"],
          ["P", "Proposer ailleurs", "Autre public ou cas d'usage"],
          ["E", "Éliminer", "Simplifier le MVP"],
          ["R", "Inverser", "Retourner le flux ou le claim"],
        ].map(([letter, verb, hint]) => (
          <li
            key={letter}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <span className="font-bold text-[var(--accent)]">{letter}</span>
            <span className="ml-2 font-medium">{verb}</span>
            <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/scamper/libre"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
        >
          Mon idée (hors catalogue)
        </Link>
        <Link
          href="/pick"
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          Choisir via les cartes
        </Link>
        <Link
          href="/ideas"
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          Catalogue
        </Link>
        <Link
          href="/random"
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          Idée aléatoire
        </Link>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Parcours catalogue :{" "}
        <strong>Cartes → SCAMPER → Brainstorm → Prepare</strong>
        <br />
        Parcours idée originale :{" "}
        <strong>SCAMPER libre → Brainstorm libre</strong>
      </p>
    </div>
  );
}
