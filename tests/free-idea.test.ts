// tests/free-idea.test.ts
import { describe, expect, it } from "vitest";
import { freeIdeaToCatalogShape, isFreeIdeaId } from "../src/lib/ideas/free-idea";

describe("free-idea", () => {
  it("detects free idea ids", () => {
    expect(isFreeIdeaId("libre-trust-lens-abc")).toBe(true);
    expect(isFreeIdeaId("idea-01-001-foo")).toBe(false);
  });

  it("maps to catalog shape for brainstorm", () => {
    const shaped = freeIdeaToCatalogShape({
      id: "libre-test",
      title: "Ma dApp",
      tagline: "Pitch court",
      description: "Description longue",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    });
    expect(shaped.slug).toBe("libre-test");
    expect(shaped.category).toBe("Idée libre");
    expect(shaped.tags).toContain("free-idea");
  });
});
