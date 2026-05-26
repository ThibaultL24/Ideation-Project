// src/app/admin/migration/page.tsx
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { MigrationReport } from "@/lib/ideas/schema";

function loadReport(): MigrationReport | null {
  const reportPath = path.join(
    process.cwd(),
    "data/reports/migration-report.json",
  );
  if (!existsSync(reportPath)) return null;
  return JSON.parse(readFileSync(reportPath, "utf8")) as MigrationReport;
}

export default function StudioAdminPage() {
  const report = loadReport();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Studio</h1>
      <p className="text-sm text-[var(--muted)]">
        Vue opérateur — statistiques d&apos;indexation du catalogue.
      </p>

      {!report ? (
        <p className="text-[var(--muted)]">Aucun rapport disponible.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Projets", report.totalIdeas],
              ["Fiches", report.githubMarkdownGenerated],
              ["Métadonnées IPFS", report.ipfsJsonGenerated],
              ["Doublons retirés", report.duplicatesRemoved],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <p className="text-xs text-[var(--muted)]">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="font-semibold">Par catégorie</h2>
            <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto text-sm text-[var(--muted)]">
              {Object.entries(report.byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <li key={category} className="flex justify-between gap-4">
                    <span>{category}</span>
                    <span className="text-white">{count}</span>
                  </li>
                ))}
            </ul>
          </section>

          <p className="text-xs text-[var(--muted)]">
            Mis à jour {report.generatedAt} · {report.network}
          </p>
        </div>
      )}
    </div>
  );
}
