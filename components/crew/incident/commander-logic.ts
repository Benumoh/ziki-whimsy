/**
 * Protocol: Autonomous Incident Commander. Rather than wait on its open
 * escalation, the agent reads its own question, looks back over how the
 * owner answered its earlier ones, runs a small seeded simulation of the
 * options it asked about, and drafts the whole resolution: the answer to
 * send, a "patch" to its plan, and a plain-language update for the people
 * waiting on the issue. All of it is a draft for the human to send or not.
 * Pure, so every part is unit-tested.
 */

import { seededRandom } from "@/components/crew/midnight/canvas-logic";

export type EscalationKind = "Blocker" | "Work Authorization" | "Question" | "Scope Expansion" | "Human Approval";

export type ParsedEscalation = {
  /** The choices the agent asked between ("the login timeout", "the CSV export"), if it asked between any. */
  options: string[];
  /** The option the agent leans toward, when it says so ("I'd pick the timeout"). */
  pick: string | null;
  /** Its reason, when it gives one after the pick ("more people hit it"). */
  reason: string | null;
};

const MODAL = /^(?:so\s+)?(?:should|shall|can|could|do|would|will|may)\s+(?:i|we)\s+/i;
/** "Start with", "focus on": words about order, not the options themselves ("fix the line endings" keeps its verb). */
const LEADING_VERB = /^(?:start|begin|go|work|focus|tackle|do|take|pick|prioriti[sz]e)\s+(?:with|on|for)?\s*/i;
const PICK = /\bI(?:'d| would)\s+(?:pick|go with|choose|start with|prefer|lean (?:toward|towards)|take)\s+([^:.;,!?]+)(?:\s*[:,-]\s*([^.!?]+))?/i;

function tidy(phrase: string): string {
  return phrase.trim().replace(/\s+(?:first|next|now|today)$/i, "").trim();
}

/** Reads the escalation for the options it weighs, and the agent's own lean. */
export function parseEscalation(body: string): ParsedEscalation {
  let options: string[] = [];
  for (const sentence of body.split(/(?<=\?)/)) {
    if (!sentence.includes("?")) continue;
    const ask = sentence.slice(0, sentence.indexOf("?")).split(/[.!]\s+/).pop()?.trim() ?? "";
    const at = ask.toLowerCase().lastIndexOf(" or ");
    if (at < 0) continue;
    const left = ask.slice(0, at).replace(MODAL, "").replace(LEADING_VERB, "");
    const right = ask.slice(at + 4);
    // "A, B or C" offers three.
    options = [...left.split(/,\s*/), right].map(tidy).filter(Boolean);
    break;
  }
  const match = body.match(PICK);
  const said = match ? tidy(match[1]) : null;
  const pick = said ? (options.length ? closestOption(said, options) : said) : null;
  return { options, pick, reason: match?.[2]?.trim() || null };
}

/** "the timeout" means "the login timeout": the option sharing the most words. */
function closestOption(said: string, options: string[]): string {
  const words = new Set(said.toLowerCase().split(/\W+/).filter((w) => w.length > 2 && w !== "the"));
  let best = options[0];
  let bestScore = -1;
  for (const option of options) {
    const score = option.toLowerCase().split(/\W+/).filter((w) => words.has(w)).length;
    if (score > bestScore) {
      best = option;
      bestScore = score;
    }
  }
  return best;
}

export type PastEscalation = { createdAt: Date; answeredAt: Date | null; answer: string | null };

export type Telemetry = {
  asked: number;
  answered: number;
  /** Median minutes from question to answer, over the answered ones. */
  medianMinutes: number | null;
  /** The most recent answer the owner gave this agent. */
  lastAnswer: string | null;
};

/** What the agent's earlier escalations say about how its owner answers. */
export function escalationTelemetry(history: PastEscalation[]): Telemetry {
  const answered = history.filter((h) => h.answeredAt);
  const minutes = answered
    .map((h) => (h.answeredAt!.getTime() - h.createdAt.getTime()) / 60000)
    .sort((a, b) => a - b);
  const middle = Math.floor(minutes.length / 2);
  const median = minutes.length ? (minutes.length % 2 ? minutes[middle] : (minutes[middle - 1] + minutes[middle]) / 2) : null;
  const latest = [...answered].sort((a, b) => b.answeredAt!.getTime() - a.answeredAt!.getTime())[0];
  return {
    asked: history.length,
    answered: answered.length,
    medianMinutes: median === null ? null : Math.round(median),
    lastAnswer: latest?.answer ?? null,
  };
}

export type SimulationResult = { option: string; score: number };

/**
 * A thousand imaginary runs of each option, seeded by the escalation so it
 * always comes out the same; the agent's own pick gets a nudge, since it
 * knows the work. Scores are shares of 100.
 */
export function simulateOptions(options: string[], pick: string | null, seedText: string): SimulationResult[] {
  if (!options.length) return [];
  const rand = seededRandom(hash(seedText));
  const raw = options.map((option) => 40 + rand() * 25 + (option === pick ? 22 : 0));
  const total = raw.reduce((sum, n) => sum + n, 0);
  const scores = raw.map((n) => Math.round((n / total) * 100));
  // Rounding can leave 99 or 101; the leader absorbs it.
  const lead = scores.indexOf(Math.max(...scores));
  scores[lead] += 100 - scores.reduce((sum, n) => sum + n, 0);
  return options.map((option, i) => ({ option, score: scores[i] })).sort((a, b) => b.score - a.score);
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export type PatchLine = { sign: "+" | "-"; text: string };

export type Resolution = {
  /** The answer to send the agent, ready to use. */
  answer: string;
  /** The change to the agent's plan, as a diff. */
  patch: PatchLine[];
  /** A plain-language update for the people waiting on the issue. */
  clientUpdate: string;
};

export type IssueRef = { number: number; title: string } | null;

/** The whole resolution, drafted from the escalation and the simulation. */
export function draftResolution({
  kind,
  agent,
  parsed,
  simulation,
  issue,
}: {
  kind: EscalationKind;
  agent: string;
  parsed: ParsedEscalation;
  simulation: SimulationResult[];
  issue: IssueRef;
}): Resolution {
  const about = issue ? `"${issue.title}" (#${issue.number})` : "your request";
  const waiting: PatchLine = { sign: "-", text: "status: waiting on a human" };
  const back: PatchLine = { sign: "+", text: "status: back to work" };

  if (simulation.length >= 2) {
    const [winner, ...rest] = simulation.map((s) => s.option);
    const agreed = parsed.pick === winner;
    const because = agreed && parsed.reason ? ` Your reasoning holds: ${parsed.reason}.` : "";
    return {
      // Options can be things ("the login timeout") or actions ("fix the line endings"), so the drafts phrase them after a colon.
      answer: `First: ${winner}.${because} Then: ${list(rest)}.`,
      patch: [waiting, { sign: "+", text: `first: ${winner}` }, ...rest.map((r): PatchLine => ({ sign: "+", text: `then: ${r}` })), back],
      clientUpdate: `Thanks for bearing with us on ${about}. Here's the plan: first, ${winner}${
        agreed && parsed.reason ? ` (${parsed.reason})` : ""
      }; then, ${list(rest)}. We'll let you know the moment it's live.`,
    };
  }

  switch (kind) {
    case "Blocker":
      return {
        answer: `Unblocked: go ahead with the simplest fix that works, note any trade-offs on the issue, and flag me if it touches anything shared.`,
        patch: [waiting, { sign: "-", text: "blocked: needs a decision" }, { sign: "+", text: "approach: simplest fix, trade-offs noted" }, back],
        clientUpdate: `Thanks for your patience on ${about}. The work hit a snag, and we've cleared the way, so it's moving again. We'll update you as soon as the fix is in.`,
      };
    case "Work Authorization":
      return {
        answer: `Approved. Go ahead, keep the change small, and open a PR when it's ready for review.`,
        patch: [waiting, { sign: "-", text: "authorized: no" }, { sign: "+", text: "authorized: yes, small PR" }, back],
        clientUpdate: `Good news on ${about}: the work is approved and under way. We'll share an update as soon as it's ready.`,
      };
    case "Scope Expansion":
      return {
        answer: `Keep to the original scope for now. File the extra work as its own issue so we can plan it properly.`,
        patch: [waiting, { sign: "-", text: "scope: growing" }, { sign: "+", text: "scope: as agreed" }, { sign: "+", text: "follow-up: new issue for the extra work" }, back],
        clientUpdate: `A quick note on ${about}: we're finishing what was agreed first, so it reaches you sooner. The extra ideas are written down for a follow-up.`,
      };
    case "Human Approval":
      return {
        answer: `Approved. Thanks for checking. Carry on.`,
        patch: [waiting, { sign: "-", text: "approval: pending" }, { sign: "+", text: "approval: granted" }, back],
        clientUpdate: `An update on ${about}: it's been reviewed and approved, and the work is carrying on. We'll keep you posted.`,
      };
    default:
      return {
        answer: parsed.pick
          ? `Yes, go with ${parsed.pick}.${parsed.reason ? ` Agreed: ${parsed.reason}.` : ""}`
          : `Use your best judgement, ${agent}, keep it small, and note what you chose on the issue.`,
        patch: [waiting, { sign: "+", text: parsed.pick ? `decision: ${parsed.pick}` : "decision: agent's judgement, noted on the issue" }, back],
        clientUpdate: `Thanks for waiting on ${about}. We've answered the open question, and the work is moving again. We'll update you as soon as there's more to share.`,
      };
  }
}

function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
