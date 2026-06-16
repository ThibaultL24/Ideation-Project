import { NextResponse } from "next/server";
import {
  publicGithubSession,
  readGithubSession,
} from "@/lib/auth/github-session";
import { getGithubOAuthConfig } from "@/lib/auth/github-oauth-config";

export async function GET() {
  const oauth = getGithubOAuthConfig();
  if (!oauth.ok) {
    return NextResponse.json({
      connected: false,
      oauthConfigured: false,
      reason: oauth.reason,
    });
  }

  const session = await readGithubSession(oauth.config.sessionSecret);
  if (!session) {
    return NextResponse.json({
      connected: false,
      oauthConfigured: true,
    });
  }

  return NextResponse.json(publicGithubSession(session));
}
