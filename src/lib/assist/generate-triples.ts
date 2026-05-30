// src/lib/assist/generate-triples.ts
import {
  assistTripleResponseSchema,
} from "./schemas";
import { TRIPLE_SYSTEM_PROMPT, buildTripleUserMessage } from "./prompts";
import { getAssistModel, getOpenAIClient, isAssistEnabled } from "./openai";
import {
  normalizeTripleDraft,
  runTripleLinter,
  type TripleDraft,
} from "@/lib/workshop/triple-draft";
import type { GraphInspectResult } from "@/lib/intuition/graph-inspect";
import { graphInspectForPrompt } from "@/lib/intuition/graph-inspect";
import { enrichTripleDraft, type EnrichedTripleDraft } from "./enrich-draft";

export interface GenerateTriplesInput {
  rawIntent: string;
  refinementSummary: string;
  picks: Array<{ title: string }>;
  ideaTitle: string;
  catalogDescription?: string;
  graphInspect: GraphInspectResult;
}

export async function generateTripleDraft(
  input: GenerateTriplesInput,
): Promise<{ draft: EnrichedTripleDraft; source: "openai" | "fallback" }> {
  const graphContext = graphInspectForPrompt(input.graphInspect);
  const client = getOpenAIClient();

  if (!isAssistEnabled() || !client) {
    const base = buildFallbackDraft(input);
    return {
      draft: enrichTripleDraft(base, input.graphInspect),
      source: "fallback",
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model: getAssistModel(),
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: TRIPLE_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildTripleUserMessage({
            rawIntent: input.rawIntent,
            refinementSummary: input.refinementSummary,
            catalogTitle: input.ideaTitle,
            catalogDescription: input.catalogDescription,
            picks: input.picks,
            graphContext,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty OpenAI response");

    const parsed = assistTripleResponseSchema.parse(JSON.parse(raw));
    const base = normalizeTripleDraft(
      { ...parsed, linterWarnings: [] },
      input.ideaTitle,
    );
    base.linterWarnings = runTripleLinter(base);
    mergeGraphWarnings(base, input.graphInspect);

    return {
      draft: enrichTripleDraft(base, input.graphInspect),
      source: "openai",
    };
  } catch {
    const base = buildFallbackDraft(input);
    return {
      draft: enrichTripleDraft(base, input.graphInspect),
      source: "fallback",
    };
  }
}

function mergeGraphWarnings(draft: TripleDraft, inspect: GraphInspectResult): void {
  const testnet = inspect.networks.find((n) => n.network === "testnet");
  if (testnet?.coreTriple.exists) {
    draft.linterWarnings.push(
      "Triple cœur déjà présent sur testnet — publication inutile, vérifie le Portal.",
    );
  }
  const dup = testnet?.similarAtoms.find(
    (a) =>
      a.label.toLowerCase() === draft.coreTriple.subject.toLowerCase() &&
      a.term_id !== testnet.catalogAtom?.term_id,
  );
  if (dup) {
    draft.linterWarnings.push(
      `Atom proche existant : « ${dup.label} » (${dup.term_id.slice(0, 10)}…).`,
    );
  }
}

function buildFallbackDraft(input: GenerateTriplesInput): TripleDraft {
  const title = input.ideaTitle.trim() || "New Idea";
  const testnet = input.graphInspect.networks.find((n) => n.network === "testnet");
  const exampleTriples = testnet?.subjectTriples.slice(0, 2) ?? [];
  const popular = testnet?.popularPredicates.slice(0, 3) ?? [];

  const supportFromGraph = exampleTriples.map((t) => ({
    subject: title,
    predicate: t.predicate,
    object: t.object,
    rationale: `Inspiré d'un triple existant sur testnet (${t.term_id.slice(0, 8)}…).`,
    kind: "support" as const,
    recommended: true,
  }));

  if (supportFromGraph.length === 0 && popular[0]) {
    supportFromGraph.push({
      subject: title,
      predicate: popular[0].label,
      object: "early adopters",
      rationale: `Prédicat populaire sur testnet (${popular[0].usage} usages).`,
      kind: "support",
      recommended: true,
    });
  }

  const draft = normalizeTripleDraft(
    {
      ideaTitle: title,
      refinedPitch: input.refinementSummary || input.rawIntent,
      archetypeSummary: input.picks.map((p) => p.title).join(" → "),
      supportTriples: supportFromGraph,
      nestedTriples: [],
      protocolNotes: [
        "OPENAI_API_KEY absente — brouillon basé sur le graphe testnet réel.",
        "Publie le triple cœur en premier ; nested seulement si provenance nécessaire.",
      ],
    },
    title,
  );
  draft.linterWarnings = runTripleLinter(draft);
  mergeGraphWarnings(draft, input.graphInspect);
  return draft;
}
