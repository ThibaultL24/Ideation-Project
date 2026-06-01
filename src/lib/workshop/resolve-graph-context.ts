// src/lib/workshop/resolve-graph-context.ts
import type { GraphInspectResult } from "@/lib/intuition/graph-inspect";
import { buildGraphInspect, graphInspectForPrompt } from "@/lib/intuition/graph-inspect";
import type { WorkshopGraphContext } from "./graph-context";
import { graphContextForPrompt } from "./graph-context";

export async function resolveGraphInspectForAssist(input: {
  rawIntent: string;
  ideaTitle: string;
  canonicalId?: string;
  graphContext?: WorkshopGraphContext | null;
}): Promise<GraphInspectResult> {
  if (input.graphContext?.graphInspect) {
    const inspect = input.graphContext.graphInspect as GraphInspectResult;
    if (inspect.networks?.length) return inspect;
  }
  return buildGraphInspect({
    rawIntent: input.rawIntent,
    ideaTitle: input.ideaTitle,
    canonicalId: input.canonicalId,
  });
}

export function promptGraphContext(
  graphContext: WorkshopGraphContext | null | undefined,
  graphInspect: GraphInspectResult,
): object {
  if (graphContext) return graphContextForPrompt(graphContext);
  return {
    ...graphInspectForPrompt(graphInspect),
    note: "Graph rebuilt at request time (no discover snapshot in session).",
  };
}
