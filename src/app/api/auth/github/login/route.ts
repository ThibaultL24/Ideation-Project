import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createOAuthState,
  GITHUB_OAUTH_STATE_COOKIE,
  signPayload,
} from "@/lib/auth/github-session";
import {
  getGithubOAuthConfig,
  githubAuthorizeUrl,
  safeReturnTo,
} from "@/lib/auth/github-oauth-config";

export async function GET(request: Request) {
  const oauth = getGithubOAuthConfig();
  if (!oauth.ok) {
    return NextResponse.json({ error: oauth.reason }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  const statePayload = createOAuthState(returnTo);
  const stateToken = signPayload(statePayload, oauth.config.sessionSecret);

  const cookieStore = await cookies();
  cookieStore.set(GITHUB_OAUTH_STATE_COOKIE, stateToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  const authorizeUrl = githubAuthorizeUrl({
    clientId: oauth.config.clientId,
    redirectUri: oauth.config.callbackUrl,
    state: stateToken,
  });

  return NextResponse.redirect(authorizeUrl);
}
