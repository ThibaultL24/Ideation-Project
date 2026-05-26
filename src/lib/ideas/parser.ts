// src/lib/ideas/parser.ts

export interface RawParsedIdea {
  title: string;
  description: string;
  comparable?: string;
  category: string;
  categoryIndex: number;
  ideaIndex: number;
}

const CATEGORY_RE =
  /^(\d+)\.\s+(.+?)\s+\((\d+)\s+ideas?\)\s*$/;
const IDEA_START_RE = /^(\d+)\.\s+([A-Za-z][A-Za-z0-9]+)\s+[—–-]\s+(.*)$/;
const LIKE_RE = /\(Like:\s*(.+?)\)\s*$/;
const NOISE_RE =
  /^(Build on Intuition|Categories|Table of Contents|How to Use|Intuition Primitives|Cross-Cutting||\d+)$/i;

function isCategoryLine(line: string): boolean {
  return CATEGORY_RE.test(line.trim()) && !IDEA_START_RE.test(line.trim());
}

function parseCategoryLine(line: string): { index: number; name: string } | null {
  const match = line.trim().match(CATEGORY_RE);
  if (!match) return null;
  return { index: Number(match[1]), name: match[2].trim() };
}

function splitDescriptionAndComparable(text: string): {
  description: string;
  comparable?: string;
} {
  const likeMatch = text.match(LIKE_RE);
  if (!likeMatch) {
    return { description: text.trim() };
  }
  const comparable = likeMatch[1]?.trim();
  const description = text.replace(LIKE_RE, "").trim();
  return { description, comparable };
}

export function parseIdeasFromText(raw: string): RawParsedIdea[] {
  const lines = raw
    .replace(/\f/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !NOISE_RE.test(line));

  const ideas: RawParsedIdea[] = [];
  let categoryName = "";
  let categoryIndex = 0;
  let current: RawParsedIdea | null = null;

  function flushCurrent() {
    if (!current) return;
    const { description, comparable } = splitDescriptionAndComparable(
      current.description,
    );
    ideas.push({
      ...current,
      description,
      comparable,
    });
    current = null;
  }

  for (const line of lines) {
    if (isCategoryLine(line)) {
      flushCurrent();
      const category = parseCategoryLine(line);
      if (!category) continue;
      categoryName = category.name;
      categoryIndex = category.index;
      continue;
    }

    const ideaMatch = line.match(IDEA_START_RE);
    if (ideaMatch) {
      flushCurrent();
      current = {
        title: ideaMatch[2],
        description: ideaMatch[3].trim(),
        category: categoryName,
        categoryIndex,
        ideaIndex: Number(ideaMatch[1]),
      };
      continue;
    }

    if (current) {
      current.description = `${current.description} ${line}`.trim();
    }
  }

  flushCurrent();
  return ideas.filter((idea) => idea.category.length > 0 && idea.title.length > 0);
}
