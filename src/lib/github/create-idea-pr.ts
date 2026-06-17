import {
  buildPublishPlan,
  type BrainstormDraft,
  type PublishPlan,
} from "@/lib/ideas/publish-plan";
import type { Idea } from "@/lib/ideas/schema";

export interface CreateIdeaPrInput {
  idea: Idea;
  draft?: Partial<BrainstormDraft> | null;
  token?: string;
  publishRepo?: string;
  targetRepo?: string;
  baseBranch?: string;
}

export type CreateIdeaPrResult =
  | {
      mode: "created";
      prUrl: string;
      branch: string;
      prNumber?: number;
      plan: PublishPlan;
    }
  | {
      mode: "manual";
      reason: string;
      plan: PublishPlan;
      githubNewFileUrl: string;
      fallbackCommands: string[];
      targetRepo: string;
      publishRepo: string | null;
    }
  | {
      mode: "error";
      error: string;
      plan: PublishPlan;
      githubNewFileUrl: string;
      fallbackCommands: string[];
    };

interface GitHubRef {
  object?: { sha?: string };
}

interface GitHubContentFile {
  sha?: string;
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

function encodeGitHubPath(filePath: string): string {
  return filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function buildGithubNewFileUrl(
  targetRepo: string,
  baseBranch: string,
  filePath: string,
): string {
  const [owner, repo] = targetRepo.split("/");
  if (!owner || !repo) {
    return `https://github.com/intuition-box/ideas`;
  }
  return `https://github.com/${owner}/${repo}/new/${baseBranch}?filename=${encodeURIComponent(filePath)}`;
}

function pullRequestHead(
  publishRepo: string,
  targetRepo: string,
  branch: string,
): string {
  if (publishRepo === targetRepo) return branch;
  const [publishOwner] = publishRepo.split("/");
  return publishOwner ? `${publishOwner}:${branch}` : branch;
}

async function getExistingFileSha(
  owner: string,
  repo: string,
  filePath: string,
  branch: string,
  token: string,
): Promise<string | undefined> {
  try {
    const file = await githubJson<GitHubContentFile>(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeGitHubPath(filePath)}?ref=${encodeURIComponent(branch)}`,
      { method: "GET", token },
    );
    return file.sha;
  } catch {
    return undefined;
  }
}

export async function createIdeaGithubPr(
  input: CreateIdeaPrInput,
): Promise<CreateIdeaPrResult> {
  const plan = buildPublishPlan(input.idea, input.draft);
  const targetRepo =
    input.targetRepo?.trim() || "intuition-box/ideas";
  const baseBranch = input.baseBranch?.trim() || "main";
  const token = input.token?.trim();
  const publishRepo = input.publishRepo?.trim();
  const newFileUrl = buildGithubNewFileUrl(targetRepo, baseBranch, plan.githubPath);

  if (!token || !publishRepo) {
    return {
      mode: "manual",
      reason:
        "Connect your GitHub account to open a PR from your fork.",
      plan,
      githubNewFileUrl: newFileUrl,
      fallbackCommands: plan.fallbackCommands,
      targetRepo,
      publishRepo: publishRepo ?? null,
    };
  }

  const [owner, repo] = publishRepo.split("/");
  const [targetOwner, targetName] = targetRepo.split("/");
  if (!owner || !repo || !targetOwner || !targetName) {
    return {
      mode: "error",
      error: "Invalid GITHUB_PUBLISH_REPO or GITHUB_TARGET_REPO (expected owner/repo).",
      plan,
      githubNewFileUrl: newFileUrl,
      fallbackCommands: plan.fallbackCommands,
    };
  }

  try {
    const ref = await githubJson<GitHubRef>(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(baseBranch)}`,
      { method: "GET", token },
    );
    const baseSha = ref.object?.sha;
    if (!baseSha) throw new Error("Could not read base branch on fork.");

    const branch = `${plan.branchName}-${Date.now().toString(36)}`;
    await githubJson(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: "POST",
      token,
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: baseSha,
      }),
    });

    const existingSha = await getExistingFileSha(
      owner,
      repo,
      plan.githubPath,
      branch,
      token,
    );

    const putBody: Record<string, string> = {
      message: `idea: ${input.idea.title}`,
      content: Buffer.from(plan.markdown, "utf8").toString("base64"),
      branch,
    };
    if (existingSha) putBody.sha = existingSha;

    await githubJson<GitHubCommit>(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeGitHubPath(plan.githubPath)}`,
      {
        method: "PUT",
        token,
        body: JSON.stringify(putBody),
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
          head: pullRequestHead(publishRepo, targetRepo, branch),
          base: baseBranch,
        }),
      },
    );

    if (!pr.html_url) throw new Error("PR created but URL missing in GitHub response.");

    return {
      mode: "created",
      prUrl: pr.html_url,
      branch,
      prNumber: pr.number,
      plan,
    };
  } catch (error) {
    return {
      mode: "error",
      error: error instanceof Error ? error.message : String(error),
      plan,
      githubNewFileUrl: newFileUrl,
      fallbackCommands: plan.fallbackCommands,
    };
  }
}
