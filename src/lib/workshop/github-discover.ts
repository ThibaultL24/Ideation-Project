// src/lib/workshop/github-discover.ts
export interface GithubIssueHit {
  title: string;
  url: string;
  state: string;
  number: number;
}

export async function searchGithubIdeasRepo(
  rawIntent: string,
  ideaTitle: string,
): Promise<{ issues: GithubIssueHit[]; error?: string }> {
  const token = process.env["GITHUB_TOKEN"]?.trim();
  const terms = `${ideaTitle} ${rawIntent}`
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((t) => t.length >= 4)
    .slice(0, 3);

  if (terms.length === 0) {
    return { issues: [] };
  }

  const q = `repo:intuition-box/ideas ${terms.join(" ")}`;
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&per_page=8`;

  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { headers, next: { revalidate: 300 } });
    if (!res.ok) {
      return {
        issues: [],
        error: token
          ? `GitHub search HTTP ${res.status}`
          : "Set GITHUB_TOKEN to search intuition-box/ideas",
      };
    }

    const data = (await res.json()) as {
      items?: Array<{
        title?: string;
        html_url?: string;
        state?: string;
        number?: number;
      }>;
    };

    const issues = (data.items ?? [])
      .filter((i) => i.html_url && i.title)
      .map((i) => ({
        title: i.title!,
        url: i.html_url!,
        state: i.state ?? "unknown",
        number: i.number ?? 0,
      }));

    return { issues };
  } catch (e) {
    return {
      issues: [],
      error: e instanceof Error ? e.message : "GitHub search failed",
    };
  }
}
