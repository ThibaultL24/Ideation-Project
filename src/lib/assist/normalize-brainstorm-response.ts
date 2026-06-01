// src/lib/assist/normalize-brainstorm-response.ts
import type { BrainstormDirection } from "@/lib/workshop/brainstorm";

interface NormalizeBrainstormInput {
  explorationPrompt: string;
}

function pad(text: string, min: number, filler: string): string {
  const t = text.trim();
  if (t.length >= min) return t;
  return t ? `${t}. ${filler}`.slice(0, Math.max(min, t.length + filler.length)) : filler.slice(0, min);
}

export function normalizeBrainstormResponse(
  raw: unknown,
  input: NormalizeBrainstormInput,
): Record<string, unknown> {
  const root =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const territory = pad(
    typeof root.territory === "string" ? root.territory : "",
    40,
    `Exploring ideas around: ${input.explorationPrompt.slice(0, 120)}`,
  );

  const clarifyingQuestions = Array.isArray(root.clarifyingQuestions)
    ? root.clarifyingQuestions
        .map((q) => (typeof q === "string" ? q.trim() : ""))
        .filter(Boolean)
    : [];
  while (clarifyingQuestions.length < 4) {
    clarifyingQuestions.push(
      pad(
        "",
        10,
        "Which audience do you want to serve first — consumers, institutions, or builders?",
      ),
    );
  }

  let directions: BrainstormDirection[] = [];
  if (Array.isArray(root.directions)) {
    directions = root.directions
      .map((item, i) => {
        if (!item || typeof item !== "object") return null;
        const o = item as Record<string, unknown>;
        const title =
          typeof o.title === "string"
            ? o.title.trim()
            : typeof o.name === "string"
              ? o.name.trim()
              : `Direction ${i + 1}`;
        const id =
          typeof o.id === "string" ? o.id.trim() : `direction-${i + 1}`;
        return {
          id,
          title,
          tagline: pad(typeof o.tagline === "string" ? o.tagline : "", 15, title),
          angle: pad(typeof o.angle === "string" ? o.angle : "", 3, "Product"),
          problemHook: pad(
            typeof o.problemHook === "string"
              ? o.problemHook
              : typeof o.problem === "string"
                ? o.problem
                : "",
            30,
            "A clear user pain exists in this space but is underserved by portable trust.",
          ),
          intuitionFit: pad(
            typeof o.intuitionFit === "string"
              ? o.intuitionFit
              : typeof o.intuition === "string"
                ? o.intuition
                : "",
            30,
            "Claims become stake-weighted triples that apps and communities can reuse.",
          ),
          mvpSketch: pad(
            typeof o.mvpSketch === "string" ? o.mvpSketch : typeof o.mvp === "string" ? o.mvp : "",
            20,
            "Ship a narrow loop in one city or niche with read-only graph integration first.",
          ),
          whyInteresting: pad(
            typeof o.whyInteresting === "string"
              ? o.whyInteresting
              : typeof o.why === "string"
                ? o.why
                : "",
            20,
            "Fresh angle for the Intuition ecosystem with room to differentiate.",
          ),
          risks: Array.isArray(o.risks)
            ? o.risks.map((r) => String(r).trim()).filter(Boolean).slice(0, 4)
            : ["Cold start on content and staking incentives"],
        } satisfies BrainstormDirection;
      })
      .filter((d): d is BrainstormDirection => d !== null);
  }

  return {
    territory,
    clarifyingQuestions: clarifyingQuestions.slice(0, 6),
    directions,
    recommendedDirectionId:
      typeof root.recommendedDirectionId === "string"
        ? root.recommendedDirectionId
        : typeof root.recommendedId === "string"
          ? root.recommendedId
          : directions[0]?.id,
  };
}
