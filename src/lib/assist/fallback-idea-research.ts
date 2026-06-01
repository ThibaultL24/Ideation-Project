// src/lib/assist/fallback-idea-research.ts
import type { CatalogMatch } from "@/lib/workshop/discover-similar";
import type { GithubIssueHit } from "@/lib/workshop/github-discover";
import type { DeepResearchReport } from "@/lib/workshop/idea-research";
import { normalizeIdeaBrief } from "@/lib/workshop/idea-brief";
import type { GenerateIdeaResearchInput } from "./idea-research-input";

function isCulturalGpsIntent(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return (
    (p.includes("gps") || p.includes("map") || p.includes("carte")) &&
    (p.includes("histor") || p.includes("culturel") || p.includes("cultural") || p.includes("vie"))
  );
}

function isCinemaIntent(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return /cinema|cinelma|cinem|film|movie|theatre|theater|screening/.test(p);
}

function richCulturalGpsFallback(
  input: GenerateIdeaResearchInput,
  title: string,
): Omit<DeepResearchReport, "generatedAt"> {
  const similar = buildSimilarList(input.catalogMatches, input.githubIssues);

  return {
    headline: `${title}: staked cultural memory on the map`,
    similarIdeas: similar,
    diagnostic: {
      summary: `${title} sits at the intersection of location-based discovery, cultural heritage, and personal narrative — a space where incumbents (museums, Wikipedia, Google Maps labels) offer information but rarely economic conviction behind claims. The core opportunity is to let walkers see "life paths" of historical figures or communities with claims that can be staked, disputed, and ranked on Intuition rather than buried in unstructured reviews. Main risks: cold-start content (who seeds the first accurate paths), liability on sensitive history, and GPS accuracy in dense urban cores. Intuition fits when each path segment, figure, or source becomes an atom and quality claims (accuracy, sourcing, representativeness) become stake-weighted — enabling curators, historians, and locals to compete on truth instead of SEO.`,
      strengths: [
        "Clear emotional hook: exploration + story beats generic map POIs; easy to demo in one city.",
        "Natural atom model: person, place, event, route segment, archival source — each can be a distinct identity on the graph.",
        "Stake-weighted controversy is a feature for history (multiple narratives) rather than a bug, if UX handles nuance.",
        "B2B angles exist: tourism boards, museums, schools — they need trusted routes without building their own reputation stack.",
        "Mobile-first loop (open app → walk → discover path) aligns with short MVP cycles and local pilots.",
        "Complements Intuition catalog themes (local guides, trust trails) without duplicating a full social network.",
      ],
      weaknesses: [
        "User intent is still phrased as a feature list; primary job-to-be-done (tourist vs student vs genealogist) is underspecified.",
        "Content acquisition cost is high: GPS traces + biographical data + rights for images/quotes need a sourcing policy.",
        "Without staking incentives early, the graph risks empty vaults or copy-paste from Wikidata with no economic signal.",
        "Privacy: living people and recent events on a map can create harm; moderation and time-lag rules are undefined.",
        "Offline mode, battery drain, and AR optional scope can balloon MVP if not explicitly deferred.",
        "Competition from free layers (Google Arts & Culture, local heritage apps) — differentiation must be trust + incentives, not maps alone.",
      ],
    },
    improvements: buildCulturalGpsImprovements(title),
    relatedIdeas: [
      {
        title: `${title} for schools`,
        pitch:
          "Teachers assign neighborhood walks where students verify historical claims and stake on source quality. Intuition becomes a classroom credibility layer instead of a consumer tourism app.",
        angle: "EdTech + verification",
      },
      {
        title: `${title} — curator studio`,
        pitch:
          "Web dashboard for historians and museums to publish routes, attach IPFS sources, and preview vault economics before mobile launch. Reduces mobile MVP scope while seeding the graph.",
        angle: "Supply-side tool",
      },
      {
        title: "Living memory layer",
        pitch:
          "Focus on oral histories from residents with stake on 'lived experience' claims separate from academic history — differentiated from Wikipedia-style facts.",
        angle: "Community narrative",
      },
      {
        title: `${title} API for travel apps`,
        pitch:
          "Embed stake-weighted heritage routes into existing travel planners via API; you become the trust layer, not the consumer map.",
        angle: "Platform / B2B",
      },
      {
        title: "Time-slider heritage map",
        pitch:
          "Same GPS shell but claims tagged by era; users toggle centuries and see competing path interpretations staked per period.",
        angle: "Product depth",
      },
    ],
    proposedBrief: normalizeIdeaBrief(
      {
        title,
        oneLiner:
          "A mobile cultural GPS that overlays stake-weighted life paths of historical figures and communities on the real world, so walkers discover contested, sourced stories—not static plaques.",
        problem:
          "City explorers and students rely on fragmented apps (maps, museum sites, blogs) with no shared way to judge whether a historical route or biography is accurate, representative, or up to date. Official plaques are sparse; crowdsourced content lacks economic accountability, so misinformation and bland copy coexist.",
        solution:
          `${title} shows geolocated 'life paths' (birth, work, exile, death, key events) with each segment backed by attestable claims on Intuition. Curators, historians, and locals stake on accuracy, sourcing, and inclusivity; users follow routes, flag issues, and see counter-staked alternatives. The app reads the graph for ranked narratives rather than owning a central editorial team.`,
        targetUsers:
          "Urban cultural tourists (25–45), history teachers planning local walks, and heritage volunteers/municipal curators who want credible public routes without building custom CMS tools.",
        whyNow:
          "Post-COVID walking tourism rebounded; cities fund digital heritage; LLMs make sourcing faster but worsen trust noise—staking creates a counterweight. Intuition testnet tooling for atoms/triples is mature enough for PR-first documentation.",
        intuitionAngle:
          "Each figure, place, and route segment is an atom; claims like [Marie Curie] [lived near] [this address] or [this path] [accurately reflects] [1920 sources] become triples with vaults. Disagreement is priced in: nationalist vs colonial readings can coexist with visible stake totals. Apps query the graph instead of siloing reviews in a proprietary database.",
        trustMechanism:
          "Accredited historians and institutions stake higher if their identity atoms are linked to credentials; residents stake on lived-experience claims with lower minimums. Users counter-stake on errors; popular predicates mirror ecosystem patterns (targets, has feature, sourced by). Bad actors pay to spam; readers see vault distribution before following a path.",
        mvpScope:
          "One pilot city, 3–5 curated figures, offline-friendly map tiles, walk mode with 10–15 segments each, read-only graph integration (no in-app staking yet), contributor form for correction requests, and PR README with core + support triples documented.",
        openQuestions: [
          "Which single city and persona (tourist vs school) wins first retention?",
          "What sourcing threshold qualifies a path segment for 'recommended' on the graph?",
          "How do we handle disputed or traumatic history without platform liability?",
          "Who seeds initial stakes—museum partners or paid curators?",
          "What is the minimum viable staking UX in v2 after PR validation?",
          "Do we need AR or is map + audio enough for the first loop?",
        ],
      },
      title,
      input.prompt,
    ),
  };
}

function buildSimilarList(
  catalog: CatalogMatch[],
  github: GithubIssueHit[],
): DeepResearchReport["similarIdeas"] {
  const items: DeepResearchReport["similarIdeas"] = [];
  for (const m of catalog.slice(0, 6)) {
    items.push({
      title: m.title,
      source: "catalog",
      reason: `${m.matchReason}. Tagline: « ${m.tagline} » — compare positioning and Intuition claims; borrow predicates, do not clone the product.`,
      slug: m.slug,
      tagline: m.tagline,
      url: `/ideas/${m.slug}`,
    });
  }
  for (const i of github.slice(0, 3)) {
    items.push({
      title: i.title,
      source: "github",
      reason:
        "Existing discussion in intuition-box/ideas — read before opening a PR to avoid duplicate framing and align triple vocabulary.",
      url: i.url,
    });
  }
  return items;
}

function buildCulturalGpsImprovements(
  title: string,
): DeepResearchReport["improvements"] {
  return [
    {
      framework: "JTBD",
      suggestion: `When I walk in an unfamiliar neighborhood, I want to feel connected to real stories tied to places, so I can explore with meaning instead of generic POIs. Interview 8–10 walkers in one pilot city; map functional, emotional, and social jobs before designing ${title} screens.`,
    },
    {
      framework: "First Principles",
      suggestion:
        "List what must be true for a 'life path' to be trustworthy: geospatial accuracy, chronological ordering, source citation, author identity, dispute resolution. Turn each into a claim type you will stake on Intuition rather than hide in app logic.",
    },
    {
      framework: "SCAMPER · Combine",
      suggestion: `Combine ${title} with audio guides and primary-source snippets (letters, photos) anchored as atoms linked to segments. Staking applies to 'faithful representation' of each snippet, not just GPS coordinates.`,
    },
    {
      framework: "SCAMPER · Adapt",
      suggestion:
        "Adapt Strava segment mechanics: users complete heritage routes, but completion weight follows stake on route quality, not vanity metrics — reduces gamification spam.",
    },
    {
      framework: "SWOT",
      suggestion:
        "Run SWOT explicitly on 'Wikipedia free vs staked graph paid conviction.' Weakness: content cost. Opportunity: institutions stake official routes. Threat: platform liability on contested history.",
    },
    {
      framework: "Anti-idea",
      suggestion:
        "Assume the product ships with 50% wrong paths because incentives were unclear. Write the failure post-mortem now: what moderation, sourcing, and staking rules would have prevented it — implement those in MVP policy copy.",
    },
    {
      framework: "How Might We",
      suggestion:
        "How might we show two credible but conflicting interpretations of the same street without ranking one as 'false'? Prototype split-path UI and matching counter-stake triples on testnet docs.",
    },
    {
      framework: "MoSCoW",
      suggestion:
        "Must: one city, 3 figures, walk mode, graph-backed read. Should: audio, source links. Could: AR. Won't: global coverage, in-app staking v1, user-generated routes without moderation.",
    },
    {
      framework: "Impact / Effort",
      suggestion:
        "Score features: institutional partnerships (high impact, medium effort), UGC routes (high effort, risky impact), school pilot (medium/medium). Pick one wedge for the first 90 days.",
    },
    {
      framework: "Trust Stack",
      suggestion: `Define three stake tiers for ${title}: (1) institution / credentialed historian, (2) local resident lived experience, (3) tourist confirmation 'I visited'. Map each to predicates and minimum stake amounts in the PR README.`,
    },
    {
      framework: "Blue Ocean",
      suggestion:
        "Competitors sell maps or articles; you sell accountable heritage routes. Canvas: eliminate editorial monopoly, raise transparent dispute, create economic skin-in-the-game for curators.",
    },
    {
      framework: "Intuition · Atoms",
      suggestion: `Draft atom list for ${title}: City, HistoricalFigure, LifeEvent, RouteSegment, SourceDocument, CuratorOrg. One atom = one thing; avoid 'Marie Curie and Pierre Curie tour'.`,
    },
    {
      framework: "Intuition · Triples",
      suggestion:
        "Mirror ecosystem predicates from graph context for support triples (targets, has feature, sourced by). Core triple stays [title] → top project ideas for → Intuition Protocol.",
    },
    {
      framework: "Go-to-market",
      suggestion:
        "Pilot with one museum or municipal heritage office: they co-publish the first route and stake launch claims; you offer white-label walk page. Validates supply before consumer marketing spend.",
    },
  ];
}

function richCinemaFallback(
  input: GenerateIdeaResearchInput,
  title: string,
): Omit<DeepResearchReport, "generatedAt"> {
  const similar = buildSimilarList(input.catalogMatches, input.githubIssues);

  return {
    headline: `${title}: stake-weighted discovery for film culture`,
    similarIdeas: similar,
    diagnostic: {
      summary: `${title} targets cultural discovery around cinema — a crowded space (Letterboxd, IMDb, local listings, festival sites) where ratings are cheap and institutional curation is opaque. The Intuition-shaped opportunity is to attach economic conviction to specific claims: which venues program quality retrospectives, which critics' lists hold up, which community screenings represent a neighborhood well. Without named atoms (venue, film, programmer, series, city) and stakeable claims, the product becomes another list app. Key risks: rights/IP for posters and clips, sparse data outside major cities, and cold-start if only consumers browse but nobody stakes. A sharp wedge (e.g. arthouse / repertory cinema in one city, or festival season) keeps MVP feasible.`,
      strengths: [
        "Emotional category with habitual use (weekly outings, festival spikes) — room for a niche wedge.",
        "Clear atom types: CinemaVenue, Film, Series, Curator, Festival, City, ReviewSource.",
        "Catalog neighbors (CulturalCurator, FestivalGraph, VibeCheck) offer positioning references without copying.",
        "Stake on 'faithful curation' and 'accurate scheduling' beats star averages for local scenes.",
        "B2B path: independent theaters and cultural centers need credibility signals beyond Instagram.",
        "PR-first on Intuition documents a semantic model before mobile polish.",
      ],
      weaknesses: [
        "Intent is one line — unclear if user wants listings, social, criticism, or heritage tours.",
        "Incumbents are free and entrenched; switching needs a trust primitive users understand.",
        "Showtimes and metadata APIs are fragmented; maintenance burden is real.",
        "Staking UX cannot be deferred forever if 'trust' is the headline value prop.",
        "Typos / vague naming ('cinelma') signal early stage — product title needs a crisp atom label.",
        "Overlap with generic 'cultural app' ideas in catalog — differentiation must be explicit.",
      ],
    },
    improvements: buildCinemaImprovements(title),
    relatedIdeas: [
      {
        title: `${title} — programmer ledger`,
        pitch:
          "Track series curators and venues with stake on 'coherent season' claims; film lovers follow curators, not algorithms.",
        angle: "Curator-first",
      },
      {
        title: `${title} for festivals`,
        pitch:
          "Festival edition as atom; stakeholders stake on schedule accuracy and accessibility claims during the event window.",
        angle: "Seasonal spike",
      },
      {
        title: "Neighborhood cinema map",
        pitch:
          "Combine venue discovery with stake-weighted 'best for date night / kids / avant-garde' claims per district.",
        angle: "Local discovery",
      },
      {
        title: `${title} API for cultural portals`,
        pitch:
          "City culture sites embed your trust layer for screenings instead of building editorial teams.",
        angle: "B2B",
      },
    ],
    proposedBrief: normalizeIdeaBrief(
      {
        title,
        oneLiner:
          "A cultural cinema app that surfaces where to watch what matters — with stake-weighted claims on curation quality, not just crowd stars.",
        problem:
          "Film lovers in cities with rich arthouse scenes struggle to trust fragmented listings (chains, blogs, social posts). Schedules change, hype cycles distort quality, and there is no portable reputation for venues or programmers.",
        solution: `${title} aggregates screenings and series, but ranking comes from Intuition claims: critics, regulars, and venues stake on curation, reliability, and audience fit. Users browse by mood and neighborhood; disputes are visible via vaults, not hidden moderation.`,
        targetUsers:
          "Urban cinephiles (22–40), independent theater marketers, and cultural journalists covering local scenes.",
        whyNow:
          input.overlapMessage ??
          "Post-streaming fatigue is pushing theatrical experiences; cities fund night culture; staking infra on Intuition testnet is documentable via PR.",
        intuitionAngle:
          "Each venue and series is an atom; claims like [Venue] [programs] [quality retrospectives] or [Showtime] [verified accurate] [date] carry stakes. Apps query the graph for conviction-weighted recommendations.",
        trustMechanism:
          "Regular attendees and partnered venues stake first; journalists stake on review claims with linked sources; users counter-stake outdated showtimes.",
        mvpScope:
          "One city, 5–10 partner venues, weekly refreshed schedule, read-only graph scores, save/share lists, no in-app staking v1.",
        openQuestions: [
          "Arthouse-only or all cinemas?",
          "Who stakes first and why do they earn fees?",
          "Data source for showtimes and legal poster use?",
          "Metric for week-1 retention: saves, visits, or check-ins?",
          "How to differ from CulturalCurator catalog positioning?",
        ],
      },
      title,
      input.prompt,
    ),
  };
}

function buildCinemaImprovements(title: string): DeepResearchReport["improvements"] {
  return [
    {
      framework: "JTBD",
      suggestion: `When Friday arrives, I want to pick a film experience that matches my mood and neighborhood, so I don't waste money on mismatched blockbusters. Run 10 interviews with arthouse regulars before designing ${title} navigation.`,
    },
    {
      framework: "Positioning",
      suggestion:
        "Write a one-sentence 'only for' statement (e.g. repertory cinema in Lyon). Reject generic 'cultural app' framing — specificity drives atoms and claims.",
    },
    {
      framework: "SCAMPER · Combine",
      suggestion: `${title} + festival calendars + stake on 'hidden gem' claims tied to programmer identity, not anonymous stars.`,
    },
    {
      framework: "SWOT",
      suggestion:
        "Strength: economic trust layer. Weakness: data ops. Opportunity: theater partnerships. Threat: free listings — document why staking beats ads.",
    },
    {
      framework: "Anti-idea",
      suggestion:
        "Imagine every showtime is wrong opening week. List moderation, verification, and liability rules before launch.",
    },
    {
      framework: "Trust Stack",
      suggestion:
        "Tier 1: venue operator stakes schedule accuracy. Tier 2: critic stakes review claims. Tier 3: attendee stakes 'worth it' — map to predicates in PR.",
    },
    {
      framework: "MoSCoW",
      suggestion:
        "Must: city scope, schedule ingest, venue pages, graph read. Should: mood filters. Won't: ticketing, social graph, global coverage in v1.",
    },
    {
      framework: "Intuition · Atoms",
      suggestion: `Atoms for ${title}: CinemaVenue, Film, Screening, Series, Programmer, Festival — never combine in one label.`,
    },
    {
      framework: "Go-to-market",
      suggestion:
        "Launch with one theater chain or cultural center; co-stake opening season claims for marketing leverage.",
    },
    {
      framework: "Metrics",
      suggestion:
        "Track saved screenings per user and venue click-through; avoid vanity MAU until trust loop is proven.",
    },
    {
      framework: "Content",
      suggestion:
        "Seed 50 stakeable claims manually (best matinee, best subtitled lineup) to demo conviction before automation.",
    },
    {
      framework: "Differentiation",
      suggestion:
        "Compare to CulturalCurator and FestivalGraph in PR — explain why you own cinema showtimes + stakes, not generic curation.",
    },
  ];
}

function genericRichFallback(
  input: GenerateIdeaResearchInput,
  title: string,
): Omit<DeepResearchReport, "generatedAt"> {
  const similar = buildSimilarList(input.catalogMatches, input.githubIssues);
  const domain = input.prompt.slice(0, 300);

  return {
    headline: `${title}: product thesis (local deep dive)`,
    similarIdeas: similar,
    diagnostic: {
      summary: `This analysis was generated locally because the OpenAI call failed or is misconfigured — still, the idea "${title}" can be stress-tested now. ${input.overlapMessage ?? "Catalog and graph overlap look manageable."} The product intent centers on: ${domain}. For Intuition, the key question is which entities become atoms and which claims users will stake real value on. Without that clarity, the app risks being a standard Web2 experience with blockchain bolted on. Use the improvements below to sharpen wedge, trust loop, and MVP before opening the GitHub PR.`,
      strengths: [
        "Problem space is stated — good anchor for interviews and graph modeling.",
        "Intuition can differentiate if claims are specific and stake-weighted, not generic ratings.",
        "Workshop flow supports catalog cross-check and PR-ready triple documentation.",
        "Adjacent catalog ideas provide predicate and positioning references.",
        "Open territory may allow a crisp atom label and bounty triple without collision.",
      ],
      weaknesses: [
        "Problem and solution fields still mirror the raw prompt — needs rewriting into user outcomes.",
        "Target segment and payment willingness are not yet evidenced.",
        "Trust mechanism lacks named staker roles and claim types.",
        "MVP boundary is undefined — scope creep risk on v1.",
        "No validation plan (interviews, pilot, metric) is attached to hypotheses.",
      ],
    },
    improvements: buildCinemaImprovements(title).slice(0, 12),
    relatedIdeas: richCinemaFallback(input, title).relatedIdeas,
    proposedBrief: normalizeIdeaBrief(
      {
        title,
        oneLiner: input.prompt.slice(0, 160),
        problem: `Users face a concrete pain around: ${input.prompt.slice(0, 400)}. Spell out frequency, severity, and current workarounds in the next edit.`,
        solution: `${title} addresses that pain with a focused loop (discover → trust signal → action). Detail the 3-step user journey and what data lives on Intuition vs off-chain.`,
        targetUsers: "Name one primary segment (role, context, geography) and one secondary segment.",
        whyNow: input.overlapMessage ?? "Technology, regulation, or behavior shift makes this timely — add citations.",
        intuitionAngle:
          "List 3–5 claim types users will stake on; explain why a graph beats a private database for this idea.",
        trustMechanism:
          "Who stakes first, on what, with what minimum economic commitment; who reads vault totals before deciding.",
        mvpScope:
          "Ship the smallest loop in 2–4 weeks: screens, success metric, and explicit non-goals.",
        openQuestions: [
          "What is the single metric for week-1 retention?",
          "Which claim is unique to Intuition for this idea?",
          "Who are the first 10 stakers and why do they care?",
          "What is out of scope for v1?",
          "What similar catalog idea do we pivot away from?",
        ],
      },
      title,
      input.prompt,
    ),
  };
}

export function buildFallbackDeepResearch(
  input: GenerateIdeaResearchInput,
): DeepResearchReport {
  const title =
    input.ideaTitle.trim() || input.prompt.slice(0, 48).trim() || "New idea";
  const body = isCulturalGpsIntent(input.prompt)
    ? richCulturalGpsFallback(input, title)
    : isCinemaIntent(input.prompt)
      ? richCinemaFallback(input, title)
      : genericRichFallback(input, title);

  return {
    ...body,
    generatedAt: new Date().toISOString(),
  };
}
