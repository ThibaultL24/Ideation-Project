import { describe, expect, it } from "vitest";
import {
  signPayload,
  verifyPayload,
  type GithubSessionPayload,
} from "../src/lib/auth/github-session";

describe("github session cookie", () => {
  const secret = "test-secret-at-least-16-chars";

  it("round-trips signed session payload", () => {
    const payload: GithubSessionPayload = {
      accessToken: "gho_test",
      login: "alice",
      publishRepo: "alice/ideas",
      createdAt: Date.now(),
    };
    const token = signPayload(payload, secret);
    const parsed = verifyPayload<GithubSessionPayload>(token, secret);
    expect(parsed?.login).toBe("alice");
    expect(parsed?.publishRepo).toBe("alice/ideas");
  });

  it("rejects tampered token", () => {
    const token = signPayload({ login: "bob" }, secret);
    const tampered = `${token}x`;
    expect(verifyPayload(tampered, secret)).toBeNull();
  });
});
