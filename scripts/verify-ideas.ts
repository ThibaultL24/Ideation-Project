// scripts/verify-ideas.ts
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { parseIdeasFromText } from "../src/lib/ideas/parser";
import { normalizeIdeas } from "../src/lib/ideas/normalizer";
import { loadNormalizedIdeas } from "../src/lib/ideas/load";

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW_PATH = path.join(ROOT, "data/raw/ideas.txt");
const REPORT_PATH = path.join(ROOT, "data/reports/ideas-verify-report.json");

function loadPdfText(pdfPath: string): string {
  if (!existsSync(pdfPath)) {
    throw new Error(`PDF not found: ${pdfPath}`);
  }
  return execSync(`pdftotext "${pdfPath}" -`, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
}

function main() {
  const pdfArg = process.argv.find((a) => a.endsWith(".pdf"));
  const raw = pdfArg ? loadPdfText(path.resolve(pdfArg)) : readFileSync(RAW_PATH, "utf8");
  const source = pdfArg
    ? path.resolve(pdfArg)
    : "data/raw/ideas.txt (export PDF Build on Intuition 300+ dApp Ideas)";
  const fromPdf = normalizeIdeas(parseIdeasFromText(raw));
  const onSite = loadNormalizedIdeas();

  const pdfByCanonical = new Map(fromPdf.map((i) => [i.canonicalId, i]));
  const siteByCanonical = new Map(onSite.map((i) => [i.canonicalId, i]));

  const missingOnSite = fromPdf.filter((i) => !siteByCanonical.has(i.canonicalId));
  const extraOnSite = onSite.filter((i) => !pdfByCanonical.has(i.canonicalId));
  const descriptionMismatches: Array<{
    canonicalId: string;
    title: string;
    pdf: string;
    site: string;
  }> = [];

  for (const pdfIdea of fromPdf) {
    const siteIdea = siteByCanonical.get(pdfIdea.canonicalId);
    if (!siteIdea) continue;
    if (siteIdea.description !== pdfIdea.description) {
      descriptionMismatches.push({
        canonicalId: pdfIdea.canonicalId,
        title: pdfIdea.title,
        pdf: pdfIdea.description,
        site: siteIdea.description,
      });
    }
  }

  const report = {
    source,
    generatedAt: new Date().toISOString(),
    pdfParsedCount: fromPdf.length,
    siteCount: onSite.length,
    missingOnSite: missingOnSite.map((i) => ({
      canonicalId: i.canonicalId,
      title: i.title,
    })),
    extraOnSite: extraOnSite.map((i) => ({
      canonicalId: i.canonicalId,
      title: i.title,
    })),
    descriptionMismatches: descriptionMismatches.slice(0, 20),
    descriptionMismatchCount: descriptionMismatches.length,
    ok:
      missingOnSite.length === 0 &&
      extraOnSite.length === 0 &&
      descriptionMismatches.length === 0,
  };

  mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
