import { NextResponse } from "next/server";
import { clearGithubSessionCookie } from "@/lib/auth/github-session";

export async function POST() {
  await clearGithubSessionCookie();
  return NextResponse.json({ ok: true });
}
