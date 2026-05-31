// src/app/api/workshop/prepare/github-pr/route.ts
import { NextResponse } from "next/server";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import { buildWorkshopPublishPlan } from "@/lib/workshop/publish-plan";
import { resolveIdeaFromSession } from "@/lib/workshop/resolve-idea";
import type { WorkshopSession } from "@/lib/workshop/session";

interface GitHubRef {
  object?: { sha?: string };
}

interface GitHubCommit {
  commit?: { sha?: string };
}

interface GitHubPullRequest {
  html_url?: string;
  number?: number;
}

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubJson<T>(
  url: string,
  init: RequestInit & { token: string },
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...githubHeaders(init.token),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const json = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(json.message ?? `GitHub HTTP ${response.status}`);
  }
  return json;
}

export async function POST(request: Request) {
  const body = (await request.json()) as { session?: WorkshopSession };
  const session = body.session;
  if (!session?.rawIntent?.trim()) {
    return NextResponse.json({ error: "session required" }, { status: 400 });
  }

  const idea = resolveIdeaFromSession(session);
  const draft = session.tripleDraft as EnrichedTripleDraft | undefined;
  const plan = buildWorkshopPublishPlan(idea, draft, session);

  const token = process.env["GITHUB_TOKEN"]?.trim();
  const targetRepo = process.env["GITHUB_TARGET_REPO"]?.trim() || "intuition-box/ideas";
  const publishRepo = process.env["GITHUB_PUBLISH_REPO"]?.trim();
  const baseBranch = process.env["GITHUB_BASE_BRANCH"]?.trim() || "main";

  if (!token || !publishRepo) {
    return NextResponse.json({
      mode: "manual",
      reason:
        "Ajoute GITHUB_TOKEN et GITHUB_PUBLISH_REPO dans .env pour créer la PR automatiquement.",
      targetRepo,
      publishRepo: publishRepo ?? null,
      plan,
    });
  }

  const [owner, repo] = publishRepo.split("/");
  const [targetOwner, targetName] = targetRepo.split("/");
  if (!owner || !repo || !targetOwner || !targetName) {
    return NextResponse.json({ error: "Invalid repo env config" }, { status: 500 });
  }

  try {
    const ref = await githubJson<GitHubRef>(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`,
      { method: "GET", token },
    );
    const baseSha = ref.object?.sha;
    if (!baseSha) throw new Error("Could not resolve base branch SHA");

    const branch = `${plan.branchName}-${Date.now().toString(36)}`;
    await githubJson(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: "POST",
      token,
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
    });

    const file = await githubJson<GitHubCommit>(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(plan.githubPath).replaceAll("%2F", "/")}`,
      {
        method: "PUT",
        token,
        body: JSON.stringify({
          message: `idea: ${idea.title}`,
          content: Buffer.from(plan.markdown, "utf8").toString("base64"),
          branch,
        }),
      },
    );

    const pr = await githubJson<GitHubPullRequest>(
      `https://api.github.com/repos/${targetOwner}/${targetName}/pulls`,
      {
        method: "POST",
        token,
        body: JSON.stringify({
          title: plan.prTitle,
          body: plan.prBody,
          head: `${owner}:${branch}`,
          base: baseBranch,
        }),
      },
    );

    return NextResponse.json({
      mode: "created",
      branch,
      commitSha: file.commit?.sha,
      prUrl: pr.html_url,
      prNumber: pr.number,
      plan,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        mode: "manual",
        plan,
      },
      { status: 502 },
    );
  }
}
