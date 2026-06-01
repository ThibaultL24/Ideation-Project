// src/lib/assist/openai.ts
import OpenAI from "openai";

const FALLBACK_MODELS = ["gpt-3.5-turbo", "gpt-4o-mini", "gpt-4o"] as const;

export function isAssistEnabled(): boolean {
  if (process.env["ASSIST_ENABLED"] === "false") return false;
  return Boolean(process.env["OPENAI_API_KEY"]?.trim());
}

export function getOpenAIClient(): OpenAI | null {
  const key = process.env["OPENAI_API_KEY"]?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export function getAssistModel(): string {
  return process.env["OPENAI_MODEL"]?.trim() || "gpt-4o-mini";
}

/** Models to try in order when the configured model is rejected (403). */
export function getAssistModelCandidates(): string[] {
  const preferred = getAssistModel();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of [preferred, ...FALLBACK_MODELS]) {
    if (!seen.has(m)) {
      seen.add(m);
      out.push(m);
    }
  }
  return out;
}

export function formatAssistError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "ZodError" && "issues" in error) {
      const issues = (error as { issues: Array<{ path: (string | number)[] }> }).issues;
      const fields = [...new Set(issues.map((i) => i.path[0]).filter((p) => typeof p === "string"))];
      return `Invalid AI JSON shape (${issues.length} fields${fields.length ? `: ${fields.slice(0, 4).join(", ")}` : ""})`;
    }
    return error.message;
  }
  return String(error);
}
