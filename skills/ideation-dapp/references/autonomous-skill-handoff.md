# Handoff: autonomous skill → Hunch

The conversational skill lives upstream:

`intuition-box/intuition-ideation-skill`

It must stay a **3-step** path (Describe & search → Structure → Challenge) and **must not publish** (no GitHub PR, no atoms).

## Recommendations for the autonomous skill (do not edit from this repo)

- During **Structure**, adapt help to what the idea needs (clarify, Intuition fit, MVP gaps) without naming brainstorming methods.
- Emit a structured JSON payload compatible with Hunch `SkillIdeaImport` v1.
- Keep an explicit rule: _This skill does not publish — continue in Hunch._

## Hunch import contract (this repo)

```ts
type SkillIdeaImport = {
  version: 1;
  source: "intuition-ideation-skill";
  title: string;
  summary: string;
  problem?: string;
  solution?: string;
  users?: string;
  intuitionFit?: string;
  mvp?: string;
  risks?: string[];
};
```

Parser: `src/lib/ideas/skill-idea-import.ts`. UI paste zone on the brainstorm workspace. Preview + confirm required; never auto-publish.
