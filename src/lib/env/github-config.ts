// src/lib/env/github-config.ts
/** Upstream repo users fork for OAuth PRs (default: intuition-box/ideas). */
export const DEFAULT_GITHUB_TARGET_REPO = "intuition-box/ideas";

/** Branch PRs target on the upstream repo (default: main). */
export const DEFAULT_GITHUB_BASE_BRANCH = "main";

export interface GithubPublishEnv {
  /** Upstream catalog repo — each user forks `{login}/{repoName}`. */
  targetRepo: string;
  /** Base branch for PRs into targetRepo. */
  baseBranch: string;
  /** Optional server bot token (internal / CI only — not for public visitors). */
  botToken?: string;
  /** Repo the bot pushes to when GITHUB_TOKEN is set (e.g. org/ideas). */
  botPublishRepo?: string;
}

export function getGithubPublishEnv(): GithubPublishEnv {
  return {
    targetRepo:
      process.env["GITHUB_TARGET_REPO"]?.trim() || DEFAULT_GITHUB_TARGET_REPO,
    baseBranch:
      process.env["GITHUB_BASE_BRANCH"]?.trim() || DEFAULT_GITHUB_BASE_BRANCH,
    botToken: process.env["GITHUB_TOKEN"]?.trim() || undefined,
    botPublishRepo: process.env["GITHUB_PUBLISH_REPO"]?.trim() || undefined,
  };
}
