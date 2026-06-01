// src/components/workshop/intuition-inspect-panel.tsx
"use client";

import type { GraphInspectResult, NetworkGraphInspect } from "@/lib/intuition/graph-inspect";

const PORTAL_TESTNET = "https://testnet.portal.intuition.systems/explore/home";

interface IntuitionInspectPanelProps {
  data: GraphInspectResult | null;
  loading: boolean;
  activeNetwork: "testnet" | "mainnet";
  onNetworkChange: (n: "testnet" | "mainnet") => void;
}

function NetworkSection({ net }: { net: NetworkGraphInspect }) {
  return (
    <div className="space-y-4 text-xs">
      {net.errors.length > 0 && (
        <p className="text-amber-400">{net.errors.join(" · ")}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <span
          className={
            net.coreTriple.exists
              ? "rounded border border-emerald-800/60 px-2 py-0.5 text-emerald-300"
              : "rounded border border-[var(--border)] px-2 py-0.5 text-[var(--muted)]"
          }
        >
          Core triple: {net.coreTriple.exists ? "exists" : "missing"}
        </span>
        {net.catalogAtom && (
          <span className="rounded border border-blue-800/60 px-2 py-0.5 text-blue-300">
            Catalog atom {net.catalogAtom.fromMigration ? "(migration)" : ""}
          </span>
        )}
      </div>

      {net.similarAtoms.length > 0 && (
        <div>
          <h4 className="mb-2 font-medium text-[var(--foreground)]">Similar atoms</h4>
          <ul className="max-h-36 space-y-1 overflow-y-auto">
            {net.similarAtoms.slice(0, 8).map((a) => (
              <li key={a.term_id} className="font-mono text-[var(--muted)]">
                {a.label}
                <span className="ml-1 text-[10px]">
                  · pred:{a.predicateUsage} · {a.type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {net.subjectTriples.length > 0 && (
        <div>
          <h4 className="mb-2 font-medium text-[var(--foreground)]">Existing triples (subject)</h4>
          <ul className="max-h-32 space-y-1 overflow-y-auto">
            {net.subjectTriples.map((t) => (
              <li key={t.term_id} className="text-[var(--muted)]">
                {t.subject} → {t.predicate} → {t.object}
              </li>
            ))}
          </ul>
        </div>
      )}

      {net.popularPredicates.length > 0 && (
        <div>
          <h4 className="mb-2 font-medium text-[var(--foreground)]">Popular predicates</h4>
          <p className="text-[var(--muted)]">
            {net.popularPredicates
              .slice(0, 6)
              .map((p) => `${p.label} (${p.usage})`)
              .join(" · ")}
          </p>
        </div>
      )}

      <a
        href={PORTAL_TESTNET}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-[var(--accent)] hover:underline"
      >
        Portal {net.network} →
      </a>
    </div>
  );
}

export function IntuitionInspectPanel({
  data,
  loading,
  activeNetwork,
  onNetworkChange,
}: IntuitionInspectPanelProps) {
  const net = data?.networks.find((n) => n.network === activeNetwork);

  return (
    <aside className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <h3 className="text-sm font-semibold">Intuition graph</h3>
        <div className="flex gap-1">
          {(["testnet", "mainnet"] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onNetworkChange(n)}
              className={`rounded px-2 py-0.5 text-[10px] uppercase ${
                activeNetwork === n
                  ? "bg-[var(--accent)] text-black"
                  : "text-[var(--muted)] hover:text-white"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        {loading && <p className="text-xs text-[var(--muted)]">GraphQL inspection…</p>}
        {!loading && !data && (
          <p className="text-xs text-[var(--muted)]">
            Onchain data will appear here (atoms, triples, predicates).
          </p>
        )}
        {!loading && net && <NetworkSection net={net} />}
        {data?.searchTerms.length ? (
          <p className="mt-3 text-[10px] text-[var(--muted)]">
            Search: {data.searchTerms.join(", ")}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
