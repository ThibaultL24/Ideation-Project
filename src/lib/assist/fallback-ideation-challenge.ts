// src/lib/assist/fallback-ideation-challenge.ts

export function buildFallbackIdeationChallenge(params: {
  headline: string;
  intuitionFit: string;
  overlapMessage?: string;
}) {
  return {
    mainObjection: `« ${params.headline} » must prove that staking adds more than likes or classic votes. If users have no reason to put value behind their claims, the idea works just as well on Web2 — and Intuition is no longer necessary.`,
    counterDirection:
      "What if the first version flipped the logic: instead of asking users to stake, the app reads existing signal from the Intuition graph to rank or recommend, and only introduces staking once value is demonstrated.",
    killerAssumptions: [
      "Early users accept staking (or at least attesting) without immediate financial incentive.",
      `Intuition fit is real: ${params.intuitionFit.slice(0, 120)}…`,
      "Cold start is surmountable with a single pilot community.",
    ],
    openQuestions: [
      "What is the first concrete claim someone would stake on?",
      "What does a user see when they arrive and the graph is still empty?",
      params.overlapMessage
        ? `How to differentiate from existing work? (${params.overlapMessage})`
        : "Does a similar atom or idea already exist on the graph?",
    ],
    verdict:
      "Promising idea, but the « why Intuition » must be proven with a specific use case before building. Local stress test (no AI) — re-run with an OpenAI key for a finer critique.",
  };
}
