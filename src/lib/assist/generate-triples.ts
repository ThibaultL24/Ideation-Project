// src/lib/assist/generate-triples.ts
import { assistTripleResponseSchema } from "./schemas";
import { fetchEcosystemTripleExamples } from "./fetch-triple-examples";
import { TRIPLE_SYSTEM_PROMPT, buildTripleUserMessage } from "./prompts";
import { refineTripleDraft } from "./refine-triple-draft";
import { getAssistModel, getOpenAIClient, isAssistEnabled } from "./openai";
import {
  normalizeTripleDraft,
  runTripleLinter,
  type TripleDraft,
} from "@/lib/workshop/triple-draft";
import type { GraphInspectResult } from "@/lib/intuition/graph-inspect";
import { graphInspectForPrompt } from "@/lib/intuition/graph-inspect";
import { enrichTripleDraft, type EnrichedTripleDraft } from "./enrich-draft";

import { resolveWorkshopAtomLabel } from "@/lib/workshop/atom-label";
import type { IdeaBrief } from "@/lib/workshop/idea-brief";

export interface GenerateTriplesInput {
  rawIntent: string;
  refinementSummary: string;
  ideaTitle: string;
  catalogDescription?: string;
  ideaBrief?: IdeaBrief;
  graphInspect: GraphInspectResult;
}

function resolveTitle(input: GenerateTriplesInput): string {
  return resolveWorkshopAtomLabel({
    rawIntent: input.rawIntent,
    catalogTitle: input.ideaTitle,
    ideaBrief: input.ideaBrief,
  });
}

function finalizeDraft(
  draft: TripleDraft,
  input: GenerateTriplesInput,
): TripleDraft {
  const testnet = input.graphInspect.networks.find((n) => n.network === "testnet");
  const refined = refineTripleDraft(draft, {
    ideaTitle: resolveTitle(input),
    ideaBrief: input.ideaBrief,
    rawIntent: input.rawIntent,
    popularPredicates: testnet?.popularPredicates ?? [],
    coreAlreadyExists: testnet?.coreTriple.exists,
  });
  refined.linterWarnings = runTripleLinter(refined);
  mergeGraphWarnings(refined, input.graphInspect);
  return refined;
}

export async function generateTripleDraft(
  input: GenerateTriplesInput,
): Promise<{ draft: EnrichedTripleDraft; source: "openai" | "fallback" }> {
  const graphContext = graphInspectForPrompt(input.graphInspect);
  const ecosystemTripleExamples = await fetchEcosystemTripleExamples(input.graphInspect);
  const client = getOpenAIClient();

  if (!isAssistEnabled() || !client) {
    const base = finalizeDraft(buildFallbackDraft(input, ecosystemTripleExamples), input);
    return {
      draft: enrichTripleDraft(base, input.graphInspect),
      source: "fallback",
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model: getAssistModel(),
      temperature: 0.2,
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
            ideaBrief: input.ideaBrief,
            graphContext,
            ecosystemTripleExamples,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty OpenAI response");

    const parsed = assistTripleResponseSchema.parse(JSON.parse(raw));
    const atomLabel = resolveTitle(input);
    const base = finalizeDraft(
      normalizeTripleDraft({ ...parsed, linterWarnings: [] }, atomLabel),
      input,
    );

    return {
      draft: enrichTripleDraft(base, input.graphInspect),
      source: "openai",
    };
  } catch {
    const base = finalizeDraft(buildFallbackDraft(input, ecosystemTripleExamples), input);
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
      "Core triple may already exist on testnet — check Portal for verification.",
    );
  }
  const dup = testnet?.similarAtoms.find(
    (a) =>
      a.label.toLowerCase() === draft.coreTriple.subject.toLowerCase() &&
      a.term_id !== testnet.catalogAtom?.term_id,
  );
  if (dup) {
    draft.linterWarnings.push(
      `Similar atom exists: « ${dup.label} » (${dup.term_id.slice(0, 10)}…).`,
    );
  }
}

function buildFallbackDraft(
  input: GenerateTriplesInput,
  examples: Awaited<ReturnType<typeof fetchEcosystemTripleExamples>>,
): TripleDraft {
  const title = resolveTitle(input);
  const testnet = input.graphInspect.networks.find((n) => n.network === "testnet");

  const supportFromExamples = examples.slice(0, 3).map((ex) => ({
    subject: title,
    predicate: ex.predicate,
    object: ex.object,
    rationale: `Aligned with graph (idea « ${ex.ideaLabel} »).`,
    kind: "support" as const,
    recommended: true,
  }));

  const draft = normalizeTripleDraft(
    {
      ideaTitle: title,
      refinedPitch:
        input.ideaBrief?.oneLiner ||
        input.refinementSummary ||
        input.rawIntent,
      archetypeSummary:
        input.ideaBrief?.intuitionAngle?.slice(0, 120) || "Workshop deep research",
      supportTriples: supportFromExamples,
      nestedTriples: [],
      protocolNotes: [
        "Draft from testnet graph + product brief.",
        testnet?.coreTriple.exists
          ? "Bounty triple may already exist for a similar subject."
          : "Standard bounty triple documented for the PR.",
      ],
    },
    title,
  );

  return draft;
}
