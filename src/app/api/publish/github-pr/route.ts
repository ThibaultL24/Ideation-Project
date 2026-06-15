import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import { resolvePublishIdea } from "@/lib/ideas/resolve-publish-idea";
import {
  buildGithubNewFileUrl,
  createIdeaGithubPr,
} from "@/lib/github/create-idea-pr";
import { getGithubOAuthConfig } from "@/lib/auth/github-oauth-config";
import { readGithubSessionFromRequest } from "@/lib/auth/github-session";
import { ensureUserIdeasFork } from "@/lib/github/user-fork";
import { buildPublishPlan } from "@/lib/ideas/publish-plan";

function loginUrl(returnTo: string): string {
  return `/api/auth/github/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export async function POST(request: NextRequest) {
  let body: {
    slug?: string;
    idea?: unknown;
    draft?: Partial<BrainstormDraft>;
    prompt?: string;
    category?: string;
    returnTo?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const idea = resolvePublishIdea(body);
  if (!idea) {
    return NextResponse.json(
      {
        error:
          "Idea not found — rechargez la page ou complétez le brouillon avant de publier.",
      },
      { status: 404 },
    );
  }

  const oauth = getGithubOAuthConfig();
  const targetRepo =
    oauth.ok ? oauth.config.targetRepo : process.env["GITHUB_TARGET_REPO"]?.trim() || "intuition-box/ideas";
  const baseBranch =
    oauth.ok ? oauth.config.baseBranch : process.env["GITHUB_BASE_BRANCH"]?.trim() || "main";
  const plan = buildPublishPlan(idea, body.draft);
  const newFileUrl = buildGithubNewFileUrl(targetRepo, baseBranch, plan.githubPath);

  let token: string | undefined;
  let publishRepo: string | undefined;

  if (oauth.ok) {
    const session = readGithubSessionFromRequest(
      request,
      oauth.config.sessionSecret,
    );
    if (session) {
      try {
        publishRepo = await ensureUserIdeasFork({
          accessToken: session.accessToken,
          login: session.login,
          targetRepo: oauth.config.targetRepo,
        });
        token = session.accessToken;
      } catch (error) {
        return NextResponse.json(
          {
            mode: "error",
            error:
              error instanceof Error
                ? error.message
                : "Fork GitHub utilisateur inaccessible.",
            plan,
            githubNewFileUrl: newFileUrl,
            fallbackCommands: plan.fallbackCommands,
          },
          { status: 502 },
        );
      }
    }
  }

  if (!token) {
    const envToken = process.env["GITHUB_TOKEN"]?.trim();
    const envPublishRepo = process.env["GITHUB_PUBLISH_REPO"]?.trim();
    if (envToken && envPublishRepo) {
      token = envToken;
      publishRepo = envPublishRepo;
    }
  }

  if (!token || !publishRepo) {
    const returnTo = body.returnTo?.trim() || "/brainstorm";
    return NextResponse.json(
      {
        mode: "auth_required",
        reason:
          "Connectez votre compte GitHub pour ouvrir une PR depuis votre fork.",
        loginUrl: loginUrl(returnTo),
        plan,
        githubNewFileUrl: newFileUrl,
        fallbackCommands: plan.fallbackCommands,
        targetRepo,
        publishRepo: null,
        oauthConfigured: oauth.ok,
      },
      { status: 401 },
    );
  }

  const result = await createIdeaGithubPr({
    idea,
    draft: body.draft,
    token,
    publishRepo,
    targetRepo,
    baseBranch,
  });

  if (result.mode === "created") {
    return NextResponse.json(result);
  }

  if (result.mode === "manual") {
    return NextResponse.json(result);
  }

  return NextResponse.json(result, { status: 502 });
}
