import { NextResponse } from "next/server";
import {
  createOAuthState,
  GITHUB_OAUTH_STATE_COOKIE,
  oauthStateCookieOptions,
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

  const authorizeUrl = githubAuthorizeUrl({
    clientId: oauth.config.clientId,
    redirectUri: oauth.config.callbackUrl,
    state: stateToken,
  });

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(
    GITHUB_OAUTH_STATE_COOKIE,
    stateToken,
    oauthStateCookieOptions(),
  );
  return response;
}
