// src/lib/ideas/slug.ts

export function slugifyTitle(title: string): string {
  return title
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function generateCanonicalId(
  categoryIndex: number,
  ideaIndex: number,
  title: string,
): string {
  const slug = slugifyTitle(title);
  return `idea-${String(categoryIndex).padStart(2, "0")}-${String(ideaIndex).padStart(3, "0")}-${slug}`;
}

export function githubIdeaFolderPath(slug: string, date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `ideas/${yyyy}-${mm}-${dd}-${slug}`;
}
