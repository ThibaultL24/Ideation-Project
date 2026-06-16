import { describe, expect, it } from "vitest";
import {
  categoryFromSlug,
  categoryToSlug,
} from "@/lib/ideas/category";

describe("category slugs", () => {
  it("round-trips category names", () => {
    const name = "Creative Arts & Culture";
    const slug = categoryToSlug(name);
    expect(slug).toBe("creative-arts-culture");
    expect(categoryFromSlug(slug, [name])).toBe(name);
  });
});
