interface GitHubRepo {
  full_name?: string;
  message?: string;
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
      ...(init.headers ?? {}),
    },
  });
  const json = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(json.message ?? `GitHub HTTP ${response.status}`);
  }
  return json;
}

export function userPublishRepo(login: string, targetRepo: string): string {
  const [, repoName] = targetRepo.split("/");
  if (!repoName) throw new Error("Invalid GITHUB_TARGET_REPO.");
  return `${login}/${repoName}`;
}

export async function ensureUserIdeasFork(params: {
  accessToken: string;
  login: string;
  targetRepo?: string;
}): Promise<string> {
  const targetRepo = params.targetRepo?.trim() || "intuition-box/ideas";
  const publishRepo = userPublishRepo(params.login, targetRepo);
  const [owner, repo] = publishRepo.split("/");
  if (!owner || !repo) throw new Error("Could not determine user fork.");

  const existing = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers: githubHeaders(params.accessToken) },
  );
  if (existing.ok) return publishRepo;

  if (existing.status !== 404) {
    const err = (await existing.json()) as { message?: string };
    throw new Error(err.message ?? `GitHub HTTP ${existing.status}`);
  }

  await githubJson<GitHubRepo>(
    `https://api.github.com/repos/${targetRepo}/forks`,
    {
      method: "POST",
      token: params.accessToken,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ default_branch_only: true }),
    },
  );

  return publishRepo;
}

export async function exchangeGithubCode(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri,
    }),
  });

  const json = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !json.access_token) {
    throw new Error(
      json.error_description || json.error || "GitHub OAuth failed.",
    );
  }

  return json.access_token;
}

export async function fetchGithubUser(accessToken: string): Promise<{
  login: string;
  avatarUrl?: string;
}> {
  const user = await githubJson<{ login?: string; avatar_url?: string }>(
    "https://api.github.com/user",
    { method: "GET", token: accessToken },
  );
  if (!user.login) throw new Error("Profil GitHub incomplet.");
  return { login: user.login, avatarUrl: user.avatar_url };
}
