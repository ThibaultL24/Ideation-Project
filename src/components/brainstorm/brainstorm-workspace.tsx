// src/components/brainstorm/brainstorm-workspace.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Idea } from "@/lib/ideas/schema";
import {
  DEFAULT_BRAINSTORM_DRAFT,
  buildPublishPlan,
  normalizeBrainstormDraft,
  type BrainstormArchetype,
  type BrainstormDraft,
} from "@/lib/ideas/publish-plan";
import { BrainstormPublishSection } from "./brainstorm-publish-section";

const SECTIONS = [
  {
    id: "problem",
    label: "Probleme",
    placeholder: "Qui souffre de quoi ? Comment s'en sort-on aujourd'hui ?",
  },
  {
    id: "solution",
    label: "Solution",
    placeholder: "Que fait le produit ? Parcours utilisateur en 3 etapes.",
  },
  {
    id: "users",
    label: "Utilisateurs cibles",
    placeholder: "Les 100 premiers utilisateurs, de facon precise.",
  },
  {
    id: "intuitionFit",
    label: "Pourquoi Intuition",
    placeholder: "Atoms, triples, staking : qu'est-ce qui est indispensable ?",
  },
  {
    id: "mvp",
    label: "MVP",
    placeholder: "Trois ecrans ou workflows pour une version hackathon.",
  },
  {
    id: "risks",
    label: "Risques",
    placeholder: "Redondance, cold start, UX crypto, qualite du graphe.",
  },
  {
    id: "challenge",
    label: "Challenge",
    placeholder: "Pourquoi cette idee pourrait echouer ? Que faut-il prouver ?",
  },
  {
    id: "supportTriples",
    label: "Triples de soutien",
    placeholder: "Un par ligne. Exemple : StakeReview -> targets -> consumers",
  },
] as const;

type DraftKey = (typeof SECTIONS)[number]["id"];

const ARCHETYPES: Array<{ id: BrainstormArchetype; label: string; hint: string }> = [
  { id: "curated-list", label: "Liste curee", hint: "classer, recommander, decouvrir" },
  { id: "reputation", label: "Reputation", hint: "avis, scores, confiance" },
  { id: "social-attestation", label: "Attestations", hint: "preuves entre pairs" },
  { id: "risk-detection", label: "Risque", hint: "fraude, securite, alertes" },
  { id: "prediction-signal", label: "Signal", hint: "marches, prediction, conviction" },
  { id: "agent-memory", label: "Agents IA", hint: "memoire, contexte, RAG" },
];

function storageKey(slug: string) {
  return `brainstorm-draft:${slug}`;
}

interface BrainstormWorkspaceProps {
  idea: Idea;
}

export function BrainstormWorkspace({ idea }: BrainstormWorkspaceProps) {
  const [draft, setDraft] = useState<BrainstormDraft>(DEFAULT_BRAINSTORM_DRAFT);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey(idea.slug));
    if (!raw) {
      setDraft({
        ...DEFAULT_BRAINSTORM_DRAFT,
        problem: idea.description.slice(0, 500),
      });
      return;
    }
    try {
      setDraft(normalizeBrainstormDraft(JSON.parse(raw) as Partial<BrainstormDraft>));
    } catch {
      /* ignore */
    }
  }, [idea.slug, idea.description]);

  function updateField(id: DraftKey, value: string) {
    setDraft((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  }

  function updateArchetype(archetype: BrainstormArchetype) {
    setDraft((prev) => ({ ...prev, archetype }));
    setSaved(false);
  }

  function saveDraft() {
    localStorage.setItem(storageKey(idea.slug), JSON.stringify(draft));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const plan = buildPublishPlan(idea, draft);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--accent)]">
            Outil 1 - Brainstorm
          </p>
          <h1 className="mt-1 text-2xl font-bold">{idea.title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{idea.tagline}</p>
        </div>
        <a
          href="#publication"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
        >
          Preparer & publier
        </a>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Affinez le brouillon ci-dessous, puis utilisez la section{" "}
        <strong>Preparer & publier</strong> en bas de page pour deposer une PR
        GitHub (atoms apres fusion).
      </p>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold">Archetype Intuition</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ARCHETYPES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateArchetype(item.id)}
              className={`rounded-lg border p-3 text-left text-sm transition ${
                draft.archetype === item.id
                  ? "border-[var(--accent)] bg-teal-950/30"
                  : "border-[var(--border)] hover:border-[var(--accent)]"
              }`}
            >
              <span className="block font-medium">{item.label}</span>
              <span className="mt-1 block text-xs text-[var(--muted)]">
                {item.hint}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <label key={section.id} className="block">
            <span className="text-sm font-semibold">{section.label}</span>
            <textarea
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              rows={section.id === "supportTriples" ? 3 : 4}
              placeholder={section.placeholder}
              value={draft[section.id]}
              onChange={(e) => updateField(section.id, e.target.value)}
            />
          </label>
        ))}
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="font-semibold">Linter semantique</h2>
          {plan.readiness.warnings.length === 0 ? (
            <p className="mt-2 text-sm text-emerald-300">
              Le brouillon est assez structure pour une PR et un plan onchain.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-amber-200">
              {plan.readiness.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="font-semibold">Triple coeur</h2>
          <p className="mt-3 rounded-lg bg-[var(--background)] p-3 font-mono text-xs text-[var(--muted)]">
            {plan.coreTriple.join(" - ")}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Les triples de soutien restent en preview pour eviter de fragmenter le graphe.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveDraft}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          {saved ? "Enregistre" : "Enregistrer le brouillon"}
        </button>
        {!idea.slug.startsWith("draft-") ? (
          <Link
            href={`/ideas/${idea.slug}`}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
          >
            Fiche catalogue
          </Link>
        ) : null}
        <Link
          href="/brainstorm"
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          Retour aux themes
        </Link>
      </div>

      <BrainstormPublishSection idea={idea} draft={draft} />
    </div>
  );
}
