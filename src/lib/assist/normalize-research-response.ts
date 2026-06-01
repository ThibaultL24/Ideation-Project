// src/lib/assist/normalize-research-response.ts
import type { GenerateIdeaResearchInput } from "./idea-research-input";

function coerceString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object" && "text" in item) {
          return String((item as { text: unknown }).text).trim();
        }
        return typeof item === "object" ? JSON.stringify(item) : String(item);
      })
      .filter(Boolean)
      .join("\n");
  }
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.text === "string") return o.text.trim();
    if (typeof o.description === "string") return o.description.trim();
  }
  return fallback;
}

function coerceStringArray(value: unknown, min = 1): string[] {
  if (Array.isArray(value)) {
    const items = value.map((v) => coerceString(v)).filter((s) => s.length > 0);
    if (items.length >= min) return items;
  }
  if (typeof value === "string" && value.trim()) {
    const items = value
      .split(/\n+/)
      .map((s) => s.replace(/^[-*•]\d+\.\s*/, "").trim())
      .filter(Boolean);
    if (items.length >= min) return items;
  }
  return [];
}

function pickField(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = obj[key];
    const s = coerceString(v);
    if (s) return s;
  }
  return "";
}

function padMin(text: string, min: number, filler: string): string {
  const t = text.trim();
  if (t.length >= min) return t;
  const pad = filler.trim();
  if (!t) return pad.slice(0, Math.max(min, pad.length));
  const combined = `${t}. ${pad}`;
  return combined.length >= min ? combined : combined + pad.slice(0, min - combined.length);
}

function defaultRelatedIdeas(ideaTitle: string): Array<{ title: string; pitch: string; angle: string }> {
  const t = ideaTitle.trim() || "This product";
  return [
    {
      title: `${t} — community wedge`,
      pitch: padMin(
        `${t} starts with a narrow community that already shares places and stories, then expands once trust signals exist on Intuition.`,
        20,
        "Focus on one city or one audience before scaling distribution.",
      ),
      angle: "Go-to-market",
    },
    {
      title: `${t} — B2B layer`,
      pitch: padMin(
        `Institutions license curated routes and verification workflows instead of building reputation infrastructure themselves.`,
        20,
        "Partners bring supply; Intuition supplies portable credibility.",
      ),
      angle: "B2B",
    },
    {
      title: `${t} — data API`,
      pitch: padMin(
        `Embed stake-weighted claims into existing apps via API so ${t} becomes the trust layer rather than another standalone consumer app.`,
        20,
        "Lower acquisition cost; monetize credibility infrastructure.",
      ),
      angle: "Platform",
    },
    {
      title: `${t} — curator studio`,
      pitch: padMin(
        `A web studio for experts to publish structured claims and preview vault economics before a full mobile launch.`,
        20,
        "Seeds the graph early while deferring heavy client engineering.",
      ),
      angle: "Supply-side",
    },
  ];
}

function repairNormalizedResearch(
  out: Record<string, unknown>,
  input: GenerateIdeaResearchInput,
): Record<string, unknown> {
  const title = coerceString(out.headline) || input.ideaTitle;

  const diagnostic = (out.diagnostic ?? {}) as Record<string, unknown>;
  out.diagnostic = {
    summary: padMin(
      coerceString(diagnostic.summary),
      80,
      `Deep research for ${input.ideaTitle}: refine differentiation, Intuition fit, and go-to-market before publishing.`,
    ),
    strengths: coerceStringArray(diagnostic.strengths, 1).map((s) =>
      padMin(s, 12, "Strength noted for follow-up."),
    ),
    weaknesses: coerceStringArray(diagnostic.weaknesses, 1).map((w) =>
      padMin(w, 12, "Risk to validate."),
    ),
  };

  const diag = out.diagnostic as { strengths: string[]; weaknesses: string[] };
  while (diag.strengths.length < 5) {
    diag.strengths.push(
      padMin(
        `Clear link to ${input.ideaTitle} and Intuition staking as a trust primitive.`,
        12,
        "Expand with user evidence.",
      ),
    );
  }
  while (diag.weaknesses.length < 5) {
    diag.weaknesses.push(
      padMin("MVP scope and differentiation vs catalog neighbors need sharper boundaries.", 12, "Validate in interviews."),
    );
  }

  let related = Array.isArray(out.relatedIdeas) ? [...out.relatedIdeas] : [];
  related = related
    .map((item) => {
      if (typeof item === "string") {
        return {
          title: item.slice(0, 60),
          pitch: padMin(item, 20, "Variant worth exploring with Intuition attestations."),
          angle: "Variant",
        };
      }
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const pitch = pickField(o, ["pitch", "description", "summary", "concept"]);
      const itemTitle = pickField(o, ["title", "name", "idea"]) || pitch.slice(0, 60);
      return {
        title: itemTitle,
        pitch: padMin(pitch || itemTitle, 20, "Expand this variant in a follow-up workshop pass."),
        angle: pickField(o, ["angle", "type", "category", "variant"]) || "Variant",
      };
    })
    .filter(Boolean);

  const defaults = defaultRelatedIdeas(title);
  for (let i = related.length; i < 4; i++) {
    related.push(defaults[i % defaults.length]);
  }
  out.relatedIdeas = related.slice(0, 8);

  let improvements = Array.isArray(out.improvements) ? [...out.improvements] : [];
  improvements = improvements
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const framework = pickField(o, ["framework", "method", "lens"]) || "Improvement";
      const suggestion = pickField(o, ["suggestion", "action", "recommendation", "text"]);
      if (!suggestion) return null;
      return {
        framework,
        suggestion: padMin(
          suggestion,
          40,
          "Make the next step concrete for this idea and measurable within two weeks.",
        ),
      };
    })
    .filter(Boolean);

  while (improvements.length < 12) {
    improvements.push({
      framework: "JTBD",
      suggestion: padMin(
        `Interview 5–8 target users of ${input.ideaTitle} and map the job they hire the product for; tie each job to one attestable claim on Intuition.`,
        40,
        "Document findings before expanding MVP scope.",
      ),
    });
  }
  out.improvements = improvements.slice(0, 20);

  out.headline = padMin(coerceString(out.headline), 10, input.ideaTitle);

  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeRawResearchResponse(
  raw: unknown,
  input: GenerateIdeaResearchInput,
): Record<string, unknown> {
  const root =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const diagnosticRaw =
    root.diagnostic && typeof root.diagnostic === "object"
      ? (root.diagnostic as Record<string, unknown>)
      : {};

  const briefRaw =
    root.proposedBrief && typeof root.proposedBrief === "object"
      ? (root.proposedBrief as Record<string, unknown>)
      : root.ideaBrief && typeof root.ideaBrief === "object"
        ? (root.ideaBrief as Record<string, unknown>)
        : {};

  const similarFromCatalog = input.catalogMatches.slice(0, 8).map((m) => ({
    title: m.title,
    source: "catalog",
    reason: `${m.matchReason}. Compare tagline « ${m.tagline} » — borrow predicates, do not clone.`,
    slug: m.slug,
    tagline: m.tagline,
    url: `/ideas/${m.slug}`,
  }));

  let similarIdeas = Array.isArray(root.similarIdeas)
    ? root.similarIdeas
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const o = item as Record<string, unknown>;
          const title = pickField(o, ["title", "name", "label"]);
          if (!title) return null;
          const sourceRaw = coerceString(o.source, "catalog").toLowerCase();
          const source =
            sourceRaw === "github" || sourceRaw === "graph" ? sourceRaw : "catalog";
          return {
            title,
            source,
            reason: pickField(o, ["reason", "why", "explanation", "summary"]) || title,
            url: coerceString(o.url) || undefined,
            slug: coerceString(o.slug) || undefined,
            tagline: coerceString(o.tagline) || undefined,
          };
        })
        .filter(Boolean)
    : [];

  if (!similarIdeas.length) similarIdeas = similarFromCatalog;

  const relatedIdeas = Array.isArray(root.relatedIdeas)
    ? root.relatedIdeas
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const o = item as Record<string, unknown>;
          const title = pickField(o, ["title", "name", "idea"]);
          const pitch = pickField(o, ["pitch", "description", "summary", "concept"]);
          const angle = pickField(o, ["angle", "type", "category", "variant"]);
          if (!title && !pitch) return null;
          return {
            title: title || pitch.slice(0, 60),
            pitch: pitch || title,
            angle: angle || "Variant",
          };
        })
        .filter(Boolean)
    : [];

  const improvements = Array.isArray(root.improvements)
    ? root.improvements
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const o = item as Record<string, unknown>;
          const framework = pickField(o, ["framework", "method", "lens"]) || "Improvement";
          const suggestion = pickField(o, ["suggestion", "action", "recommendation", "text"]);
          if (!suggestion) return null;
          return { framework, suggestion };
        })
        .filter(Boolean)
    : [];

  const strengths = coerceStringArray(diagnosticRaw.strengths, 0);
  const weaknesses = coerceStringArray(diagnosticRaw.weaknesses, 0);

  const base = {
    headline:
      coerceString(root.headline) ||
      coerceString(briefRaw.title) ||
      input.ideaTitle,
    similarIdeas,
    diagnostic: {
      summary:
        coerceString(diagnosticRaw.summary) ||
        coerceString(root.summary) ||
        input.prompt,
      strengths: strengths.length ? strengths : ["Intent captured — expand with user interviews."],
      weaknesses: weaknesses.length
        ? weaknesses
        : ["Differentiation vs catalog neighbors needs a sharper wedge."],
    },
    improvements,
    relatedIdeas,
    proposedBrief: {
      title: pickField(briefRaw, ["title", "name"]) || input.ideaTitle,
      oneLiner: pickField(briefRaw, ["oneLiner", "one_liner", "tagline", "elevator_pitch"]),
      problem: pickField(briefRaw, ["problem", "pain", "challenge"]),
      solution: pickField(briefRaw, ["solution", "approach", "product"]),
      targetUsers: coerceString(briefRaw.targetUsers ?? briefRaw.target_users),
      whyNow: pickField(briefRaw, ["whyNow", "why_now", "timing"]),
      intuitionAngle: pickField(briefRaw, [
        "intuitionAngle",
        "intuition_angle",
        "intuition",
      ]),
      trustMechanism: pickField(briefRaw, [
        "trustMechanism",
        "trust_mechanism",
        "trust",
      ]),
      mvpScope: coerceString(briefRaw.mvpScope ?? briefRaw.mvp_scope ?? briefRaw.mvp),
      openQuestions: briefRaw.openQuestions ?? briefRaw.open_questions ?? [],
    },
  };

  return repairNormalizedResearch(base, input);
}

export function formatParseError(error: unknown): string {
  if (error instanceof Error && error.name === "ZodError") {
    const zod = error as { issues?: Array<{ path: (string | number)[]; message: string }> };
    const count = zod.issues?.length ?? 0;
    const fields = [
      ...new Set(zod.issues?.map((i) => i.path[0]).filter((p) => typeof p === "string") ?? []),
    ].slice(0, 4);
    return `AI response format invalid (${count} issue${count === 1 ? "" : "s"}${fields.length ? `: ${fields.join(", ")}` : ""}).`;
  }
  return error instanceof Error ? error.message : String(error);
}
