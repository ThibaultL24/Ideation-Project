// src/lib/assist/openai.ts
import OpenAI from "openai";

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
