const DEFAULT_TARGET_REPO = "intuition-box/ideas";
const DEFAULT_BASE_BRANCH = "main";

export interface GithubOAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  sessionSecret: string;
  targetRepo: string;
  baseBranch: string;
}

function appOrigin(): string {
  const explicit = process.env["NEXT_PUBLIC_APP_URL"]?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env["VERCEL_URL"]?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export function getGithubOAuthConfig():
  | { ok: true; config: GithubOAuthConfig }
  | { ok: false; reason: string } {
  const clientId = process.env["GITHUB_OAUTH_CLIENT_ID"]?.trim();
  const clientSecret = process.env["GITHUB_OAUTH_CLIENT_SECRET"]?.trim();
  const sessionSecret = process.env["SESSION_SECRET"]?.trim();
  const callbackOverride = process.env["GITHUB_OAUTH_CALLBACK_URL"]?.trim();

  if (!clientId || !clientSecret) {
    return {
      ok: false,
      reason:
        "GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET are required.",
    };
  }
  if (!sessionSecret || sessionSecret.length < 16) {
    return {
      ok: false,
      reason: "SESSION_SECRET must be at least 16 characters.",
    };
  }

  return {
    ok: true,
    config: {
      clientId,
      clientSecret,
      callbackUrl:
        callbackOverride || `${appOrigin()}/api/auth/github/callback`,
      sessionSecret,
      targetRepo:
        process.env["GITHUB_TARGET_REPO"]?.trim() || DEFAULT_TARGET_REPO,
      baseBranch:
        process.env["GITHUB_BASE_BRANCH"]?.trim() || DEFAULT_BASE_BRANCH,
    },
  };
}

export function githubAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", "public_repo");
  url.searchParams.set("state", params.state);
  return url.toString();
}

export function safeReturnTo(raw: string | null | undefined): string {
  if (!raw) return "/brainstorm";
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return "/brainstorm";
  return value;
}
