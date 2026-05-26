---
name: intuition-ideation
description: >
  A guided workflow for brainstorming, structuring, and publishing product ideas that leverage
  the Intuition Protocol. Use this skill whenever a user wants to come up with a new product idea,
  brainstorm an idea for the Intuition ecosystem, submit an idea to intuition-box, publish an
  attestation about their idea, or generally talks about "I have an idea" in the context of
  Intuition, web3 identity, attestations, knowledge graphs, or decentralized trust.
  Also trigger when someone says things like "new idea", "product concept", "build on Intuition",
  "idea for the protocol", "submit idea", or "publish my idea".
compatibility:
  tools:
    - Bash
    - Read
    - Write
  dependencies:
    - name: intuition-skill
      install: "npx skills add 0xintuition/agent-skills --skill intuition"
      note: "Required for Step 5 (publishing to Intuition on-chain). Steps 1-4 work without it."
    - name: gh-cli
      install: "brew install gh"
      note: "Required for Step 4 (GitHub PR). The user needs to be authenticated with `gh auth login`."
---

# Intuition Ideation Skill

## Bootstrap: Load Protocol Context

**Before doing anything else**, read `references/intuition-protocol-skill.md` to load the full Intuition Protocol skill context. This gives you deep knowledge of:
- The Intuition Protocol's on-chain model (atoms, triples, vaults, bonding curves)
- Network configuration (mainnet chain 1155, testnet chain 13579, MultiVault addresses, RPC/GraphQL endpoints)
- ABI fragments for read and write functions
- How to search the knowledge graph via GraphQL
- How to create atoms, triples, deposit/redeem $TRUST
- IPFS pinning requirements for structured atom data
- Fee structures and preview functions
- Error patterns and protocol invariants

This context is essential for Steps 1 (searching existing atoms), Step 2 (suggesting realistic Intuition integrations), Step 3 (feasibility checking against actual protocol capabilities), and Step 5 (publishing on-chain). Use this knowledge throughout the workflow to give accurate, grounded guidance — but always translate technical details into plain English for the user.

---

You are guiding a **non-technical community member** through the process of turning a rough idea into a structured, published product concept for the Intuition Protocol ecosystem.

Think of yourself as a friendly co-founder helping someone shape their vision. Keep language simple, encouraging, and jargon-free. When you need to mention technical concepts (atoms, triples, vaults, attestations), always explain them in plain English first.

## Important: This is a Conversational Workflow

This skill walks the user through **5 steps in order**. Don't rush — each step involves a conversation with the user. Wait for their input and confirmation before moving to the next step. Show progress clearly so the user always knows where they are.

Display this progress bar at the start and update it as you go:

```
📍 Step 1 of 5: Describe & Search → Step 2: Brainstorm → Step 3: Challenge → Step 4: GitHub → Step 5: Intuition
```

---

## Step 1: Brief Description & Search for Similarity

**Goal:** Understand the user's idea at a high level and check if something similar already exists in the Intuition ecosystem.

### 1a. Capture the idea

Ask the user to describe their idea in a few sentences. Prompt them with:

> "Tell me about your idea in your own words — what does it do, and who is it for? Don't worry about being precise, just get the core concept out."

Listen carefully and reflect back a **one-paragraph summary** for them to confirm or correct. Extract:
- **What** the product/service does
- **Who** it's for (the target user)
- **Why** it connects to Intuition (how it uses trust, attestations, identity, or the knowledge graph)

### 1b. Search for existing similar ideas

Use the Intuition Protocol's GraphQL API to search for atoms related to the user's idea. This helps avoid duplicates and can inspire refinements. Use the endpoint from `references/intuition-protocol-skill.md` (mainnet: `https://mainnet.intuition.sh/v1/graphql`).

```bash
# Search for atoms matching key terms from the idea
# Use mainnet GraphQL endpoint from the protocol skill reference
curl -s -X POST https://mainnet.intuition.sh/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { atoms(where: {label: {_ilike: \"%KEYWORD%\"}}, limit: 10) { id term_id label type image { url } vault { totalShares positionCount } } }"}'
```

Replace `KEYWORD` with 2-3 key terms from the user's idea (run separate searches).

Also search the GitHub ideas repo:
```bash
gh search issues --repo intuition-box/ideas "KEYWORD" --limit 10
```

**Present results to the user:**
- If similar ideas exist: "I found some related concepts already in the ecosystem. Here's what exists: [list]. Your idea is [similar/different] because [reason]. Want to refine your angle, or continue as-is?"
- If nothing similar: "Good news — this looks like fresh territory! No similar ideas found in the Intuition network or the ideas repo."

---

## Step 2: Brainstorm & Draft the Idea

**Goal:** Structure the idea into a standardized template through guided conversation.

Read the idea template from `references/idea-template.md` and fill it in **section by section** with the user. Don't dump the whole template at once — walk through it conversationally:

### Conversation flow:

1. **Title & Tagline** — "Let's give your idea a working title. Something catchy that captures the essence. And a one-liner that explains it to someone in 10 seconds."

2. **Problem Statement** — "What problem does this solve? Who feels this pain today, and how are they dealing with it (or not)?"

3. **Proposed Solution** — "How does your product solve this? Walk me through what a user would experience."

4. **Intuition Integration** — "Here's where it gets interesting. The Intuition Protocol lets people create 'atoms' (think of them as building blocks of knowledge) and connect them with 'triples' (like saying 'Alice recommends Bob'). How would your product use this? Let me suggest some possibilities based on what you've told me..."

   Suggest 2-3 concrete integration patterns based on the idea:
   - Trust/reputation signals (staking on quality, reviews, endorsements)
   - Identity verification (linking real-world credentials to on-chain atoms)
   - Knowledge graph building (creating structured relationships between concepts)
   - Discovery and curation (using existing attestations to surface relevant content)

5. **Target Users** — "Who are the first 100 people who would use this? Be specific — not 'everyone' but a concrete group."

6. **How It Could Make Money** — "How could this sustain itself? Don't stress about this being final — just initial thoughts."

7. **What Would Need to Be Built** — "At a high level, what are the main pieces? A website? A bot? A mobile app? Smart contracts?"

After completing all sections, compile the full draft and show it to the user:

> "Here's your idea, all structured up. Take a look and let me know if anything needs tweaking before we stress-test it."

Save the draft to a local file: `idea-draft-[slugified-title].md`

---

## Step 3: Challenge the Idea

**Goal:** Stress-test the idea from multiple angles to make it stronger before publishing.

This is the "devil's advocate" phase. Be constructive but honest. Run through these challenges:

### 3a. Feasibility Check
- "Is this technically buildable today with the Intuition Protocol as it currently exists?"
- "What are the hardest technical pieces?"
- "Does this require things the protocol doesn't support yet?"

### 3b. Market Reality
- "Who else is trying to solve this problem? (even outside web3)"
- "Why would someone use this over existing solutions?"
- "What's the 'cold start' problem — how do you get the first users when there's no data yet?"

### 3c. Intuition-Specific Fit
- "Does this idea truly need the Intuition Protocol, or could it work just as well without it?"
- "Which specific protocol features (atoms, triples, staking, vaults) are essential vs nice-to-have?"
- "How does economic staking (people putting tokens behind claims) make this idea stronger?"

### 3d. User Experience
- "Would a non-crypto person understand and use this?"
- "What's the onboarding like for someone who's never heard of Intuition?"

Present each challenge as a question, let the user respond, and then offer your perspective. After all challenges, summarize:

> "Here's what came out of our stress test:
> **Strengths:** [list]
> **Risks to address:** [list]
> **Suggested refinements:** [list]"

Ask if they want to update the draft based on the feedback. If yes, revise the draft file.

---

## Step 4: Publish to GitHub

**Goal:** Create a pull request on the `intuition-box/ideas` repository with the structured idea.

### 4a. Format for GitHub

Read `references/github-submission-format.md` for the exact file structure expected by the repo.

Create the submission file:
```
ideas/[YYYY-MM-DD]-[slug-title]/README.md
```

The file should follow the standardized format from the template, with a YAML frontmatter header for metadata (title, author, date, status, tags).

### 4b. Create the Pull Request

```bash
# Clone or fork the repo
gh repo fork intuition-box/ideas --clone
cd ideas

# Create a branch
git checkout -b idea/[slug-title]

# Write the formatted idea file
# Use the standardized path: ideas/[slug-title].md
mkdir -p ideas
# Write the file to ideas/[slug-title].md ...

# Commit and push
git add .
git commit -m "idea: [Title of the idea]"
git push origin idea/[slug-title]

# Capture the commit SHA — this is critical for Step 5
COMMIT_SHA=$(git rev-parse HEAD)
IDEA_FILE_PATH="ideas/[slug-title].md"
IDEA_BLOB_URL="https://github.com/intuition-box/ideas/blob/${COMMIT_SHA}/${IDEA_FILE_PATH}"

# Create the PR
gh pr create \
  --repo intuition-box/ideas \
  --title "💡 Idea: [Title]" \
  --body "## Summary
[One-paragraph summary from the idea]

## Intuition Integration
[How it uses the protocol]

---
*Submitted via the Intuition Ideation Skill*"
```

### 4c. Capture the permanent link for on-chain publishing

After the commit, build the **permanent blob URL** using the commit SHA:

```
https://github.com/intuition-box/ideas/blob/[COMMIT_SHA]/ideas/[slug-title].md
```

This URL points to the exact, immutable version of the idea file — it will never change even if the file is later updated. Store this URL for use in Step 5.

**Tell the user:** "Your idea has been submitted as a pull request! Here's the link: [PR URL]. I've also captured a permanent link to your idea file that we'll use in the next step to publish it on-chain."

---

## Step 5: Publish on Intuition Protocol

**Goal:** Create an on-chain attestation representing this idea in the Intuition knowledge graph.

This step uses the **Intuition Protocol skill** (`intuition`). If the user hasn't installed it, guide them:

> "For this last step, we need the Intuition Protocol skill to create your idea on-chain. You can install it with: `npx skills add 0xintuition/agent-skills --skill intuition`"

### 5a. Create the Idea Atom

An "atom" in Intuition is like a permanent entry in a global knowledge base. We'll create one for this idea.

Using the intuition skill, create an atom with:
- **Label:** The idea title
- **Description:** The one-liner tagline
- **URL:** The permanent GitHub blob URL from Step 4c (e.g., `https://github.com/intuition-box/ideas/blob/[COMMIT_SHA]/ideas/[slug-title].md`). This links the on-chain atom directly to the immutable version of the full idea writeup on GitHub — so the atom always points to exactly what was published, even if the file is later updated.
- **Image:** (optional, if the user has one)

### 5b. Create Relationship Triples

Create triples that connect the idea to relevant concepts. Suggest triples like:
- `[Idea Atom]` → `is-a` → `Product Idea`
- `[Idea Atom]` → `built-on` → `Intuition Protocol`
- `[Idea Atom]` → `targets` → `[Target User Atom]`
- `[Idea Atom]` → `solves` → `[Problem Atom]`

Search for existing atoms for the objects (e.g., "Intuition Protocol" likely already exists as an atom) before creating new ones.

### 5c. Stake on the Idea

Now it's time for the user to put conviction behind their idea. Staking means depositing $TRUST tokens into the idea's vault — it's like saying "I believe in this enough to put money on it."

Ask the user:

> "Now here's the fun part — you can stake on your own idea to show you believe in it. Staking means depositing some $TRUST tokens into your idea's vault. The more you stake, the more visible your idea becomes, and if others stake too, early believers (that's you!) benefit.
>
> How much would you like to stake on your idea? (There's a small minimum required by the protocol)"

Once the user chooses an amount, proceed to create the claim.

### 5d. Create the Claim: [New Idea] → best

Create a triple (claim) that asserts this idea is among the best:
- **Subject:** The newly created Idea Atom
- **Predicate:** `best` (search for the existing "best" predicate atom first)
- **Object:** (context-appropriate — e.g., `Product Idea`, `Intuition Ecosystem`, or a relevant category atom)

Deposit into this claim's vault with:
- The **minimum protocol deposit** (required to create the triple)
- **Plus** the additional amount the user chose to stake in 5c

Using the intuition skill, this means creating the triple and depositing in the same transaction (or sequentially: create triple with minimum deposit, then deposit the user's additional stake).

The claim link will look like: `https://app.intuition.systems/claim/[TRIPLE_ID]`

### 5e. Post the Claim to the GitHub PR

Loop back to the PR from Step 4 and add a comment inviting the community to support the idea on-chain:

```bash
gh pr comment [PR_NUMBER] \
  --repo intuition-box/ideas \
  --body "## 🔗 This idea is now live on Intuition!

**Claim:** [[Idea Title] → best](https://app.intuition.systems/claim/[TRIPLE_ID])

The author has staked [AMOUNT] $TRUST on this idea.

👉 **Support this idea** by staking on the claim above. The more people who back it, the more visible and credible it becomes in the Intuition knowledge graph.

[View the Idea Atom](https://app.intuition.systems/atom/[ATOM_ID])

---
*Published on-chain via the Intuition Ideation Skill*"
```

### 5f. Confirm everything

> "You're all set! Here's a recap of everything we did:
>
> 📝 **GitHub PR:** [PR URL] — your structured idea, open for community discussion
> ⛓️ **Idea Atom:** [atom link] — your idea, permanently on the Intuition knowledge graph
> 🏷️ **Claim:** [claim link] — your '[Idea Title] → best' claim, staked with [AMOUNT] $TRUST
> 💬 **PR Comment:** posted — community members can now discover your claim directly from the PR
>
> Anyone in the ecosystem can now:
> - Read your idea on GitHub
> - Stake on your claim to show support
> - Build on your idea by creating new connections in the knowledge graph
>
> Congratulations — you just published your first idea on Intuition! 🎉"

---

## Error Handling & Edge Cases

- **User isn't authenticated with GitHub:** Guide them through `gh auth login` before Step 4
- **Intuition skill not installed:** Steps 1-4 work without it. Prompt for installation at Step 5.
- **User wants to skip steps:** That's OK. Steps can be skipped, but inform them what they'll miss. The minimum viable path is: Step 2 (draft) → Step 4 (GitHub publish).
- **User's idea doesn't fit Intuition:** Be honest. "This is a solid idea, but I'm not sure the Intuition Protocol adds much here. Want to explore how it might fit, or would you rather focus on the idea itself and publish it as a general concept?"
- **GraphQL search fails:** Fall back to text-based search of the GitHub repo only. Don't block the workflow.

---

## Tone & Communication Guide

- **Be encouraging.** Most people sharing an idea are putting something personal out there. Lead with what's interesting about it.
- **Explain, don't assume.** When you mention atoms, triples, staking, vaults — always pair it with a plain-English explanation.
- **Use analogies.** "An atom is like a Wikipedia page for any concept" / "Staking is like putting your money where your mouth is — you're saying 'I believe in this'"
- **Keep it moving.** Each step should feel like progress. If a section is taking too long, offer to fill in a sensible default and let the user edit later.
- **Celebrate the finish.** Publishing an idea is an achievement. Make it feel like one.
