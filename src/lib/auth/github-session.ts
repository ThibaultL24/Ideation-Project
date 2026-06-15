import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const GITHUB_SESSION_COOKIE = "ideation_github_session";
export const GITHUB_OAUTH_STATE_COOKIE = "ideation_github_oauth_state";

export interface GithubSessionPayload {
  accessToken: string;
  login: string;
  avatarUrl?: string;
  publishRepo: string;
  createdAt: number;
}

export interface GithubOAuthStatePayload {
  nonce: string;
  returnTo: string;
}

export function signPayload(payload: unknown, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

export function verifyPayload<T>(
  token: string,
  secret: string,
): T | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = createHmac("sha256", secret)
    .update(body)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function createOAuthState(returnTo: string): GithubOAuthStatePayload {
  return {
    nonce: randomBytes(16).toString("hex"),
    returnTo,
  };
}

export async function setGithubSessionCookie(
  session: GithubSessionPayload,
  secret: string,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GITHUB_SESSION_COOKIE, signPayload(session, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearGithubSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(GITHUB_SESSION_COOKIE);
}

export async function readGithubSession(
  secret: string,
): Promise<GithubSessionPayload | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(GITHUB_SESSION_COOKIE)?.value;
  if (!raw) return null;
  return verifyPayload<GithubSessionPayload>(raw, secret);
}

export function readGithubSessionFromRequest(
  request: NextRequest,
  secret: string,
): GithubSessionPayload | null {
  const raw = request.cookies.get(GITHUB_SESSION_COOKIE)?.value;
  if (!raw) return null;
  return verifyPayload<GithubSessionPayload>(raw, secret);
}

export function publicGithubSession(
  session: GithubSessionPayload,
): {
  connected: true;
  login: string;
  avatarUrl?: string;
  publishRepo: string;
} {
  return {
    connected: true,
    login: session.login,
    avatarUrl: session.avatarUrl,
    publishRepo: session.publishRepo,
  };
}
