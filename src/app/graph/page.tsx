// src/app/graph/page.tsx
import Link from "next/link";
import {
  CLAIM_PATTERN,
  fetchIdeaClaims,
  IDEA_PREDICATE_TERM_ID,
  portalExplorerUrl,
  TESTNET_GRAPHQL_CONSOLE_URL,
  TESTNET_PORTAL_URL,
} from "@/lib/intuition/claims-graph";

export default async function ExplorerPage() {
  const { total, claims } = await fetchIdeaClaims();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-[var(--accent)]">
          Explorer
        </p>
        <h1 className="text-3xl font-bold">Claims onchain</h1>
        <p className="max-w-2xl text-sm text-[var(--muted)]">
          Attestations publiées sur le testnet Intuition ({CLAIM_PATTERN.pattern}).
          Utilisez le Portal pour explorer le graphe, staker et consulter les
          fiches atom.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--accent)]/40 bg-[var(--card)] p-5">
        <h2 className="text-lg font-semibold">Intuition Portal</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Interface officielle pour explorer le protocole. Ce déploiement utilise
          le testnet (
          <code className="text-[var(--accent)]">testnet.portal.intuition.systems</code>
          ).
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={portalExplorerUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
          >
            Ouvrir l&apos;explorer →
          </a>
          <a
            href={TESTNET_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
          >
            Accueil Portal
          </a>
        </div>
        <ol className="mt-4 list-inside list-decimal space-y-2 text-sm text-[var(--muted)]">
          <li>
            Ouvrir{" "}
            <a
              href={portalExplorerUrl()}
              className="text-[var(--accent)] underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              l&apos;explorer Protocol
            </a>
          </li>
          <li>
            Rechercher un projet par nom ou le prédicat{" "}
            <code className="text-white">{CLAIM_PATTERN.predicateLabel}</code>
          </li>
          <li>Consulter la fiche atom, les claims liés et les positions</li>
          <li>
            Parcourir l&apos;onglet <strong className="text-white">Claims</strong>{" "}
            pour les attestations récentes
          </li>
        </ol>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--muted)]">Attestations</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--muted)]">Prédicat</p>
          <p className="text-sm font-medium">{CLAIM_PATTERN.predicateLabel}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--muted)]">Réseau</p>
          <p className="text-sm font-medium">Intuition testnet</p>
        </div>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Index ({claims.length})</h2>
          <a
            href={TESTNET_GRAPHQL_CONSOLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            API GraphQL →
          </a>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Predicate ID{" "}
          <span className="font-mono text-white">{IDEA_PREDICATE_TERM_ID}</span>
        </p>
        <div className="mt-4 max-h-[28rem] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[var(--card)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="py-2 pr-3">Projet</th>
                <th className="py-2 pr-3">Claim</th>
                <th className="py-2">Portal</th>
              </tr>
            </thead>
            <tbody className="text-[var(--muted)]">
              {claims.map((row) => (
                <tr
                  key={row.termId}
                  className="border-t border-[var(--border)]/60"
                >
                  <td className="py-2 pr-3 font-medium text-white">
                    {row.subjectLabel}
                  </td>
                  <td className="py-2 pr-3">
                    {row.subjectLabel}{" "}
                    <span className="text-[var(--accent)]">→</span>{" "}
                    {row.predicateLabel}{" "}
                    <span className="text-[var(--accent)]">→</span>{" "}
                    {row.objectLabel}
                  </td>
                  <td className="py-2">
                    <a
                      href={portalExplorerUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] hover:underline"
                      title={`Rechercher « ${row.subjectLabel} » sur le Portal`}
                    >
                      Ouvrir
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Fiche locale :{" "}
          <Link href="/ideas/stake-review" className="text-[var(--accent)]">
            exemple StakeReview
          </Link>
        </p>
      </section>
    </div>
  );
}
