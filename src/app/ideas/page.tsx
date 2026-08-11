// src/app/ideas/page.tsx
import { IdeasCatalogList } from "@/components/ideas/ideas-catalog-list";
import { loadCatalogIdeas } from "@/lib/ideas/load-catalog";
import { getNetworkLabel } from "@/lib/intuition/config";

interface IdeasPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function IdeasPage({ searchParams }: IdeasPageProps) {
  const params = await searchParams;
  const catalog = await loadCatalogIdeas();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catalog</h1>
        <p className="text-sm text-[var(--muted)]">
          {catalog.source === "graph"
            ? `On-chain list (${getNetworkLabel(catalog.network)}) + PR-published ideas`
            : "Local snapshot + PR-published ideas"}
        </p>
      </div>

      <IdeasCatalogList ideas={catalog.ideas} category={params.category} />
    </div>
  );
}
