import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  publicGithubSession,
  readGithubSessionFromRequest,
} from "@/lib/auth/github-session";
import { getGithubOAuthConfig } from "@/lib/auth/github-oauth-config";

export async function GET(request: NextRequest) {
  const oauth = getGithubOAuthConfig();
  if (!oauth.ok) {
    return NextResponse.json({
      connected: false,
      oauthConfigured: false,
      reason: oauth.reason,
    });
  }

  const session = readGithubSessionFromRequest(
    request,
    oauth.config.sessionSecret,
  );
  if (!session) {
    return NextResponse.json({
      connected: false,
      oauthConfigured: true,
    });
  }

  return NextResponse.json(publicGithubSession(session));
}
