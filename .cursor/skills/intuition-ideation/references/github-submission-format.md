# GitHub Submission Format

Ideas submitted to `intuition-box/ideas` follow this structure.

## File Location

```
ideas/
└── YYYY-MM-DD-slug-title/
    └── README.md
```

- **Date prefix:** The date the idea was submitted
- **Slug:** Lowercase, hyphen-separated version of the title (e.g., `decentralized-reviews-marketplace`)

## README.md Format

The file uses YAML frontmatter followed by Markdown content:

```markdown
---
title: "The Idea Title"
tagline: "One sentence that explains it in 10 seconds"
author: "Name or pseudonym"
date: "YYYY-MM-DD"
status: "draft"
tags:
  - trust
  - reviews
  - marketplace
intuition_atoms: []  # Populated after Step 5 (on-chain publishing)
github_discussion: "" # Link to any related discussion
---

# [Title]

> [Tagline]

## Problem

[Problem statement from the template]

## Solution

[Proposed solution from the template]

## How It Uses Intuition

[Intuition integration details — the table from the template rendered as prose]

## Target Users

[Target user description]

## Business Model

[Sustainability model]

## Technical Overview

[High-level architecture]

## Strengths & Risks

[From the challenge phase]

## Next Steps

[Actionable next steps]

---

*Submitted via the [Intuition Ideation Skill](https://github.com/0xIntuition/agent-skills)*
```

## Pull Request Format

**Branch name:** `idea/[slug-title]`

**PR title:** `💡 Idea: [Title]`

**PR body:**
```markdown
## Summary
[One-paragraph summary]

## Intuition Integration
[2-3 sentences on how it uses the protocol]

## Tags
[comma-separated tags]

---
*Submitted via the Intuition Ideation Skill*
```

**Labels:** (if available in the repo)
- `idea`
- `community`
- Status: `draft` / `refined` / `in-progress`
