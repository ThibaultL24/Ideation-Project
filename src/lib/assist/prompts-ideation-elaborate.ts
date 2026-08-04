// src/lib/assist/prompts-ideation-elaborate.ts
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import type { Idea } from "@/lib/ideas/schema";
import type { IdeationActionId } from "@/lib/ideas/ideation-actions";

export const IDEATION_ELABORATE_SYSTEM_PROMPT = `You help users improve product ideas for the Intuition Protocol ecosystem.
Return ONLY valid JSON matching the schema described by the user.
Rules:
- Stay faithful to the user's intent; distinguish stated facts vs your inferences vs open questions.
- Never invent on-chain term IDs, transaction hashes, or claim graph data exists without evidence.
- Support triples are suggestions only — not published facts.
- Do not mention brainstorming method names (SCAMPER, Six Hats, JTBD, Design Thinking, pre-mortem, etc.).
- Keep MVP and plans small; Hunch is not a general project-management tool.
- Write in clear English.
- suggestions[].targetField must be one of: problem, solution, users, intuitionFit, mvp, risks, challenge, supportTriples.
- Only suggest fields relevant to the action.`;

const ACTION_INSTRUCTIONS: Record<IdeationActionId, string> = {
  clarify:
    "Clarify the idea: real problem, users, current workaround, value prop, solution, ambiguities, differentiators. Suggest problem/solution/users. Label stated vs inferred vs to-confirm in sections.",
  "intuition-fit":
    "Judge whether Intuition is justified: why helpful, what works without it, possible atoms/relations, signal/staking/discovery, fake-fit risks, similar concepts. Suggest intuitionFit and supportTriples. Never invent termIds.",
  mvp: "Define a minimal MVP: first users, main journey, must-have screens, out of scope, tech deps, main hypothesis, simple validation. Suggest mvp only. Keep it hackathon-small.",
  plan: "Propose an initial elaboration plan (framing → validation → prototype → Intuition integration → user test → proposal prep → GitHub → onchain → iterate). No GitHub tickets. Usually no draft field suggestions.",
  challenge:
    "Challenge an already-shaped proposal: main objection, critical assumptions, weaknesses, risks, open questions, counter-direction, improvements, nuanced verdict. Suggest challenge and risks. No multi-agent theater.",
};

export function buildIdeationElaborateUserMessage(params: {
  action: IdeationActionId;
  idea: Idea;
  draft: BrainstormDraft;
  ideaVersion: number;
  intent?: string;
}): string {
  return JSON.stringify(
    {
      action: params.action,
      instructions: ACTION_INSTRUCTIONS[params.action],
      ideaVersion: params.ideaVersion,
      intent: params.intent ?? "",
      idea: {
        title: params.idea.title,
        tagline: params.idea.tagline,
        category: params.idea.category,
        description: params.idea.description,
        slug: params.idea.slug,
      },
      draft: params.draft,
      responseSchema: {
        title: "string",
        summary: "string",
        sections: [{ id: "string", title: "string", content: "string" }],
        suggestions: [
          {
            targetField:
              "problem|solution|users|intuitionFit|mvp|risks|challenge|supportTriples",
            proposedValue: "string",
            reason: "string?",
          },
        ],
      },
    },
    null,
    2,
  );
}
