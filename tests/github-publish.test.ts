// tests/github-publish.test.ts
import { describe, expect, it } from "vitest";
import {
  buildGitHubManualPublish,
  resolveGitHubPublishRepos,
} from "@/lib/workshop/github-publish";
import type { WorkshopPublishPlan } from "@/lib/workshop/publish-plan";

const stubPlan = {
  githubPath: "ideas/2026-05-31-demo/README.md",
  branchName: "idea/demo",
  prTitle: "Idea: Demo",
  prBody: "Summary",
  markdown: "# Demo",
} as WorkshopPublishPlan;

describe("github-publish", () => {
  it("resolveGitHubPublishRepos uses fork model when publish differs from target", () => {
    const repos = resolveGitHubPublishRepos({
      GITHUB_PUBLISH_REPO: "alice/ideas-fork",
      GITHUB_TARGET_REPO: "intuition-box/ideas",
    });
    expect(repos.sameRepo).toBe(false);
    expect(repos.publishRepo).toBe("alice/ideas-fork");
    expect(repos.targetRepo).toBe("intuition-box/ideas");
  });

  it("buildGitHubManualPublish links to GitHub new file editor", () => {
    const repos = resolveGitHubPublishRepos({
      GITHUB_PUBLISH_REPO: "alice/ideas-fork",
      GITHUB_TARGET_REPO: "intuition-box/ideas",
    });
    const manual = buildGitHubManualPublish(stubPlan, repos, "main");
    expect(manual.newFileUrl).toContain("github.com/alice/ideas-fork/new/main");
    expect(manual.newFileUrl).toContain("filename=ideas/2026-05-31-demo/README.md");
    expect(manual.compareUrl).toContain("alice:idea/demo");
  });
});
