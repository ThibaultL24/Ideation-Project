import { NextResponse } from "next/server";
import {
  GITHUB_OAUTH_STATE_COOKIE,
  GITHUB_SESSION_COOKIE,
  githubSessionCookieOptions,
  readRequestCookie,
  signPayload,
  verifyPayload,
  type GithubOAuthStatePayload,
  type GithubSessionPayload,
} from "@/lib/auth/github-session";
import {
  appPublicOrigin,
  getGithubOAuthConfig,
  safeReturnTo,
} from "@/lib/auth/github-oauth-config";
import {
  ensureUserIdeasFork,
  exchangeGithubCode,
  fetchGithubUser,
} from "@/lib/github/user-fork";

function redirectWithError(
  message: string,
  returnTo?: string,
): NextResponse {
  const url = new URL(safeReturnTo(returnTo), appPublicOrigin());
  url.searchParams.set("github_error", message.slice(0, 180));
  const response = NextResponse.redirect(url);
  response.cookies.delete(GITHUB_OAUTH_STATE_COOKIE);
  return response;
}

export async function GET(request: Request) {
  const oauth = getGithubOAuthConfig();
  if (!oauth.ok) {
    return redirectWithError(oauth.reason);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim();
  const state = searchParams.get("state")?.trim();
  if (!code || !state) {
    return redirectWithError("Missing GitHub OAuth parameters.");
  }

  const stateCookie = readRequestCookie(request, GITHUB_OAUTH_STATE_COOKIE);

  const statePayload = verifyPayload<GithubOAuthStatePayload>(
    state,
    oauth.config.sessionSecret,
  );
  const returnTo = statePayload
    ? safeReturnTo(statePayload.returnTo)
    : undefined;

  if (!stateCookie || stateCookie !== state) {
    return redirectWithError(
      "Invalid OAuth state — use the same URL as NEXT_PUBLIC_APP_URL and try again.",
      returnTo,
    );
  }

  if (!statePayload) {
    return redirectWithError("OAuth session expired.", returnTo);
  }

  try {
    const accessToken = await exchangeGithubCode({
      clientId: oauth.config.clientId,
      clientSecret: oauth.config.clientSecret,
      code,
      redirectUri: oauth.config.callbackUrl,
    });
    const user = await fetchGithubUser(accessToken);
    const publishRepo = await ensureUserIdeasFork({
      accessToken,
      login: user.login,
      targetRepo: oauth.config.targetRepo,
    });

    const session: GithubSessionPayload = {
      accessToken,
      login: user.login,
      avatarUrl: user.avatarUrl,
      publishRepo,
      createdAt: Date.now(),
    };

    const response = NextResponse.redirect(
      new URL(safeReturnTo(statePayload.returnTo), appPublicOrigin()),
    );
    response.cookies.delete(GITHUB_OAUTH_STATE_COOKIE);
    response.cookies.set(
      GITHUB_SESSION_COOKIE,
      signPayload(session, oauth.config.sessionSecret),
      githubSessionCookieOptions(),
    );
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "GitHub connection failed.";
    return redirectWithError(message, returnTo);
  }
}
