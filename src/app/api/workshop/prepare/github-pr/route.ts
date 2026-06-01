// src/app/api/workshop/prepare/github-pr/route.ts
import { NextResponse } from "next/server";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import {
  buildGitHubManualPublish,
  commitIdeaAndOpenPullRequest,
  resolveGitHubPublishRepos,
} from "@/lib/workshop/github-publish";
import { buildWorkshopPublishPlan } from "@/lib/workshop/publish-plan";
import { resolveIdeaFromSession } from "@/lib/workshop/resolve-idea";
import type { WorkshopSession } from "@/lib/workshop/session";
import { normalizeSessionForPublish } from "@/lib/workshop/workshop-path";

export async function POST(request: Request) {
  const body = (await request.json()) as { session?: WorkshopSession };
  const session = body.session;
  if (!session?.rawIntent?.trim()) {
    return NextResponse.json({ error: "session required" }, { status: 400 });
  }

  const normalized = normalizeSessionForPublish(session);
  const idea = resolveIdeaFromSession(normalized);
  const draft = normalized.tripleDraft as EnrichedTripleDraft | undefined;
  const plan = buildWorkshopPublishPlan(idea, draft, normalized);

  const token = process.env["GITHUB_TOKEN"]?.trim();
  const repos = resolveGitHubPublishRepos({
    GITHUB_PR_REPO: process.env["GITHUB_PR_REPO"],
    GITHUB_PUBLISH_REPO: process.env["GITHUB_PUBLISH_REPO"],
    GITHUB_TARGET_REPO: process.env["GITHUB_TARGET_REPO"],
  });
  const baseBranch = process.env["GITHUB_BASE_BRANCH"]?.trim() || "main";
  const manual = buildGitHubManualPublish(plan, repos, baseBranch);

  const hasWriteRepo =
    Boolean(process.env["GITHUB_PUBLISH_REPO"]?.trim()) ||
    Boolean(process.env["GITHUB_PR_REPO"]?.trim());

  if (!token || !hasWriteRepo) {
    return NextResponse.json({
      mode: "manual",
      reason:
        "Add GITHUB_TOKEN + GITHUB_PUBLISH_REPO (your fork) or GITHUB_PR_REPO for a sandbox test.",
      ...repos,
      baseBranch,
      manual,
      plan,
    });
  }

  try {
    const result = await commitIdeaAndOpenPullRequest({
      token,
      plan,
      repos,
      baseBranch,
    });

    return NextResponse.json({
      mode: "created",
      ...result,
      ...repos,
      baseBranch,
      plan,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        mode: "manual",
        ...repos,
        baseBranch,
        manual,
        plan,
      },
      { status: 502 },
    );
  }
}
