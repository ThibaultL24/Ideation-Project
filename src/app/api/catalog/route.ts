// src/app/api/catalog/route.ts
import { NextResponse } from "next/server";
import { loadCatalogIdeas } from "@/lib/ideas/load-catalog";

export async function GET() {
  const catalog = await loadCatalogIdeas();
  return NextResponse.json({
    source: catalog.source,
    network: catalog.network,
    count: catalog.ideas.length,
    onchainCount: catalog.onchainCount,
    ideas: catalog.ideas.map((idea) => ({
      slug: idea.slug,
      canonicalId: idea.canonicalId,
      title: idea.title,
      tagline: idea.tagline,
      category: idea.category,
      atomId: idea.intuition?.atomId ?? null,
    })),
  });
}
