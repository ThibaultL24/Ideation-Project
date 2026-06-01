// src/lib/workshop/github-publish.ts
import type { WorkshopPublishPlan } from "./publish-plan";

interface GitHubRef {
  object?: { sha?: string };
}

interface GitHubCommit {
  tree?: { sha?: string };
}

interface GitHubBlob {
  sha?: string;
}

interface GitHubTree {
  sha?: string;
}

interface GitHubNewCommit {
  sha?: string;
}

interface GitHubPullRequest {
  html_url?: string;
  number?: number;
}

interface GitHubRepo {
  default_branch?: string;
}

export interface GitHubPublishRepos {
  publishRepo: string;
  targetRepo: string;
  sameRepo: boolean;
  publishOwner: string;
  publishName: string;
  targetOwner: string;
  targetName: string;
}

export interface GitHubPublishResult {
  branch: string;
  commitSha?: string;
  prUrl?: string;
  prNumber?: number;
}

export interface GitHubManualPublish {
  newFileUrl: string;
  compareUrl: string;
  instructions: string;
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

function splitRepo(repo: string): [string, string] {
  const [owner, name] = repo.split("/");
  if (!owner || !name) throw new Error(`Invalid repo: ${repo}`);
  return [owner, name];
}

export function resolveGitHubPublishRepos(env: {
  GITHUB_PR_REPO?: string;
  GITHUB_PUBLISH_REPO?: string;
  GITHUB_TARGET_REPO?: string;
}): GitHubPublishRepos {
  const testRepo = env.GITHUB_PR_REPO?.trim();
  const targetRepo =
    testRepo || env.GITHUB_TARGET_REPO?.trim() || "intuition-box/ideas";
  const publishRepo = testRepo || env.GITHUB_PUBLISH_REPO?.trim() || targetRepo;
  const [publishOwner, publishName] = splitRepo(publishRepo);
  const [targetOwner, targetName] = splitRepo(targetRepo);
  return {
    publishRepo,
    targetRepo,
    sameRepo: publishOwner === targetOwner && publishName === targetName,
    publishOwner,
    publishName,
    targetOwner,
    targetName,
  };
}

export function buildGitHubManualPublish(
  plan: WorkshopPublishPlan,
  repos: GitHubPublishRepos,
  baseBranch: string,
): GitHubManualPublish {
  const [owner, name] = splitRepo(repos.publishRepo);
  const encodedPath = plan.githubPath.split("/").map(encodeURIComponent).join("/");
  const newFileUrl =
    `https://github.com/${owner}/${name}/new/${encodeURIComponent(baseBranch)}` +
    `?filename=${encodedPath}`;
  const head = repos.sameRepo
    ? plan.branchName
    : `${owner}:${plan.branchName}`;
  const [targetOwner, targetName] = splitRepo(repos.targetRepo);
  const compareUrl =
    `https://github.com/${targetOwner}/${targetName}/compare/${encodeURIComponent(baseBranch)}` +
    `...${head}?expand=1` +
    `&title=${encodeURIComponent(plan.prTitle)}` +
    `&body=${encodeURIComponent(plan.prBody)}`;

  return {
    newFileUrl,
    compareUrl,
    instructions:
      "Open the new-file link, paste the generated markdown, submit — GitHub will offer to open a PR without a manual branch step.",
  };
}

async function createBranchRefFromCommit(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  commitSha: string,
): Promise<void> {
  const refPath = `heads/${branch}`;
  try {
    await githubJson(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: "POST",
      token,
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commitSha }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes("reference already exists")) {
      throw error;
    }
    await githubJson(`https://api.github.com/repos/${owner}/${repo}/git/refs/${refPath}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ sha: commitSha, force: false }),
    });
  }
}

/** Un seul commit sur la branche PR (pas de branche vide préalable). */
export async function commitIdeaAndOpenPullRequest(input: {
  token: string;
  plan: WorkshopPublishPlan;
  repos: GitHubPublishRepos;
  baseBranch: string;
}): Promise<GitHubPublishResult> {
  const { token, plan, repos, baseBranch } = input;
  const {
    publishOwner,
    publishName,
    targetOwner,
    targetName,
    sameRepo,
  } = repos;

  const branch = plan.branchName;

  const baseRef = await githubJson<GitHubRef>(
    `https://api.github.com/repos/${publishOwner}/${publishName}/git/ref/heads/${encodeURIComponent(baseBranch)}`,
    { method: "GET", token },
  );
  const baseSha = baseRef.object?.sha;
  if (!baseSha) throw new Error("Could not resolve base branch SHA");

  const baseCommit = await githubJson<GitHubCommit>(
    `https://api.github.com/repos/${publishOwner}/${publishName}/git/commits/${baseSha}`,
    { method: "GET", token },
  );
  const baseTreeSha = baseCommit.tree?.sha;
  if (!baseTreeSha) throw new Error("Could not resolve base tree");

  const blob = await githubJson<GitHubBlob>(
    `https://api.github.com/repos/${publishOwner}/${publishName}/git/blobs`,
    {
      method: "POST",
      token,
      body: JSON.stringify({
        content: Buffer.from(plan.markdown, "utf8").toString("base64"),
        encoding: "base64",
      }),
    },
  );
  if (!blob.sha) throw new Error("Could not create blob");

  const tree = await githubJson<GitHubTree>(
    `https://api.github.com/repos/${publishOwner}/${publishName}/git/trees`,
    {
      method: "POST",
      token,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: [
          {
            path: plan.githubPath,
            mode: "100644",
            type: "blob",
            sha: blob.sha,
          },
        ],
      }),
    },
  );
  if (!tree.sha) throw new Error("Could not create tree");

  const commit = await githubJson<GitHubNewCommit>(
    `https://api.github.com/repos/${publishOwner}/${publishName}/git/commits`,
    {
      method: "POST",
      token,
      body: JSON.stringify({
        message: `idea: ${plan.prTitle.replace(/^Idea:\s*/i, "")}`,
        tree: tree.sha,
        parents: [baseSha],
      }),
    },
  );
  if (!commit.sha) throw new Error("Could not create commit");

  await createBranchRefFromCommit(token, publishOwner, publishName, branch, commit.sha);

  const pr = await githubJson<GitHubPullRequest>(
    `https://api.github.com/repos/${targetOwner}/${targetName}/pulls`,
    {
      method: "POST",
      token,
      body: JSON.stringify({
        title: plan.prTitle,
        body: plan.prBody,
        head: sameRepo ? branch : `${publishOwner}:${branch}`,
        base: baseBranch,
      }),
    },
  );

  return {
    branch,
    commitSha: commit.sha,
    prUrl: pr.html_url,
    prNumber: pr.number,
  };
}

export async function readDefaultBranch(
  token: string,
  owner: string,
  repo: string,
): Promise<string> {
  const info = await githubJson<GitHubRepo>(
    `https://api.github.com/repos/${owner}/${repo}`,
    { method: "GET", token },
  );
  return info.default_branch ?? "main";
}
