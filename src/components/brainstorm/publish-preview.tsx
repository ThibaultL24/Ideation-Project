// src/components/brainstorm/publish-preview.tsx
"use client";

import Link from "next/link";

interface PublishPreviewProps {
  markdown: string;
  slug: string;
  isFreeIdea?: boolean;
  onSave: () => void;
  saved: boolean;
}

export function PublishPreview({
  markdown,
  slug,
  isFreeIdea = false,
  onSave,
  saved,
}: PublishPreviewProps) {
  return (
    <footer className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-sm font-semibold">Prévisualisation de publication</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Markdown GitHub · créations onchain prévues · sans stake initial obligatoire
        </p>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            README (aperçu)
          </h3>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-[var(--background)] p-3 text-xs leading-relaxed text-[var(--muted)] whitespace-pre-wrap">
            {markdown}
          </pre>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Plan onchain
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
              <li>1. Atom idée (si nouveau terme)</li>
              <li>2. Triple cœur · bounty 3A</li>
              <li>3. Signal / stake — action séparée (optionnelle)</li>
            </ul>
            <p className="mt-2 rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-300">
              Création Atom/Triple possible sans dépôt initial — le staking reste
              une étape distincte.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSave}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
            >
              {saved ? "Enregistré ✓" : "Enregistrer le brouillon"}
            </button>
            {isFreeIdea ? (
              <p className="text-xs text-[var(--muted)]">
                Idée hors catalogue — exportez le README ci-dessus pour une PR
                manuelle sur{" "}
                <a
                  href="https://github.com/intuition-box/ideas"
                  className="text-[var(--accent)] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  intuition-box/ideas
                </a>
                .
              </p>
            ) : (
              <>
                <Link
                  href={`/prepare/${slug}`}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
                >
                  Préparer & publier →
                </Link>
                <Link
                  href={`/ideas/${slug}`}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
                >
                  Fiche catalogue
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
