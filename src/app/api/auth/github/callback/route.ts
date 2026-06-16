import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  GITHUB_OAUTH_STATE_COOKIE,
  setGithubSessionCookie,
  verifyPayload,
  type GithubOAuthStatePayload,
} from "@/lib/auth/github-session";
import { getGithubOAuthConfig, safeReturnTo } from "@/lib/auth/github-oauth-config";
import {
  ensureUserIdeasFork,
  exchangeGithubCode,
  fetchGithubUser,
} from "@/lib/github/user-fork";

function redirectWithError(request: Request, message: string): NextResponse {
  const origin = new URL(request.url).origin;
  const url = new URL("/brainstorm", origin);
  url.searchParams.set("github_error", message.slice(0, 180));
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const oauth = getGithubOAuthConfig();
  if (!oauth.ok) {
    return redirectWithError(request, oauth.reason);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim();
  const state = searchParams.get("state")?.trim();
  if (!code || !state) {
    return redirectWithError(request, "Paramètres OAuth GitHub manquants.");
  }

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(GITHUB_OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(GITHUB_OAUTH_STATE_COOKIE);

  if (!stateCookie || stateCookie !== state) {
    return redirectWithError(request, "État OAuth invalide — réessayez la connexion.");
  }

  const statePayload = verifyPayload<GithubOAuthStatePayload>(
    state,
    oauth.config.sessionSecret,
  );
  if (!statePayload) {
    return redirectWithError(request, "Session OAuth expirée.");
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

    await setGithubSessionCookie(
      {
        accessToken,
        login: user.login,
        avatarUrl: user.avatarUrl,
        publishRepo,
        createdAt: Date.now(),
      },
      oauth.config.sessionSecret,
    );

    const returnTo = safeReturnTo(statePayload.returnTo);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(new URL(returnTo, origin));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connexion GitHub impossible.";
    return redirectWithError(request, message);
  }
}
