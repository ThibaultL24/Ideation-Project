// src/lib/workshop/graph-context-types.ts
/** Types client-safe — pas d'import depuis graph-inspect (node:fs). */

export interface WorkshopGraphContext {
  capturedAt: string;
  searchTerms: string[];
  catalogMatches: Array<{
    title: string;
    slug: string;
    score: number;
    matchReason: string;
  }>;
  githubIssues: Array<{ title: string; url: string; state?: string }>;
  overlap: { level: "low" | "medium" | "high"; message: string };
  /** Snapshot serveur — opaque côté client. */
  graphInspect: object;
  graph: object;
}

export function graphContextForPrompt(ctx: WorkshopGraphContext | undefined | null): object {
  if (!ctx) return { note: "No graph context from discover step." };
  return {
    capturedAt: ctx.capturedAt,
    overlap: ctx.overlap,
    catalogMatches: ctx.catalogMatches,
    githubIssues: ctx.githubIssues,
    ...(ctx.graph as object),
  };
}

export function semanticWarningsFromContext(
  ctx: WorkshopGraphContext | undefined | null,
): string[] {
  if (!ctx) return ["Graph context missing — run deep research again."];
  const warnings: string[] = [];
  if (ctx.overlap.level === "high") {
    warnings.push(ctx.overlap.message);
  }
  const testnet = (ctx.graph as { networks?: Array<{ network?: string; coreTriple?: { exists?: boolean } }> })
    .networks?.find((n) => n.network === "testnet");
  if (testnet?.coreTriple?.exists) {
    warnings.push("A core triple already exists for a similar subject on testnet.");
  }
  if (ctx.catalogMatches[0]?.score && ctx.catalogMatches[0].score >= 6) {
    warnings.push(`Close catalog idea: « ${ctx.catalogMatches[0].title} ».`);
  }
  return warnings;
}
