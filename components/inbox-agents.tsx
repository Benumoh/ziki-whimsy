"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AgentGraphic } from "@/components/agent-graphic";
import type { AgentStatus } from "@/lib/dashboard-overview";
import "@/components/crew/crew.css";
import { agentSays } from "@/components/crew/agent-says";
import { PokeableAgent, SpeechBubble } from "@/components/crew/pokeable-agent";

export type InboxAgent = {
  id: string;
  name: string;
  status: AgentStatus;
  activity: string;
  /** "Last 30 days: …", already worded. */
  done: string;
  /** The question it's waiting on you to answer, when there is one. */
  question?: { id: string; body: string } | null;
  /** Its level, for the tool it works with and what it says it's doing. */
  level?: string | null;
};

const STATUS_LABEL: Record<AgentStatus, { label: string; tone: string }> = {
  working: { label: "Working", tone: "bg-zk-ok-bg text-zk-ok-fg" },
  waiting: { label: "Waiting on you", tone: "bg-zk-warn-bg text-zk-warn-fg" },
  idle: { label: "Standing by", tone: "bg-zk-info-bg text-zk-info-fg" },
  offline: { label: "Offline", tone: "bg-zk-chip text-zk-muted" },
};

/** Which agents were waiting on this viewer last time, per browser. */
const WAITING_KEY = "ziki:crew-waiting";
const QUESTION_PREVIEW = 140;

/**
 * Agents that were waiting on you last visit and aren't any more: you
 * answered them. They say thanks once (for a few seconds), then this visit's
 * waiting set becomes the one to compare against next time. Blocked or empty
 * storage just means no thanks.
 */
function useAnsweredSince(statusKey: string, onThanks: (ids: string[]) => void): Set<string> {
  const [answered, setAnswered] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    const statuses = new Map(statusKey.split(",").filter(Boolean).map((pair) => pair.split(":") as [string, string]));
    const waitingNow = [...statuses].filter(([, status]) => status === "waiting").map(([id]) => id);
    let before: string[];
    try {
      before = JSON.parse(window.localStorage.getItem(WAITING_KEY) ?? "[]");
    } catch {
      return;
    }
    const thanks = before.filter((id) => statuses.has(id) && statuses.get(id) !== "waiting");
    // Saved in the same tick as the thanks, so an effect that is set up twice
    // (React's strict mode) still sees the old record the second time.
    const settle = window.setTimeout(() => {
      try {
        window.localStorage.setItem(WAITING_KEY, JSON.stringify(waitingNow));
      } catch {
        // No storage: no record, and no thanks next time either.
      }
      if (thanks.length > 0) {
        setAnswered(new Set(thanks));
        onThanks(thanks);
      }
    }, 0);
    const hide = thanks.length > 0 ? window.setTimeout(() => setAnswered(new Set()), 6000) : undefined;
    return () => {
      window.clearTimeout(settle);
      if (hide) window.clearTimeout(hide);
    };
    // onThanks only selects an agent; the statuses are what decide the thanks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusKey]);
  return answered;
}

/**
 * Your agents in the Inbox's top box: the whole crew on a bench, each robot
 * in its mood (whoever waits on you first, bobbing), and the chosen one's
 * details under it. A waiting agent says what it's asking, with the way to
 * answer; one you've just answered says thanks. Work / Stop work is shown
 * but not wired up yet.
 */
export function InboxAgents({ agents }: { agents: InboxAgent[] }) {
  const [index, setIndex] = useState(0);
  /** The robot last poked on the bench, and when, so a second poke spins it again. */
  const [poked, setPoked] = useState<{ id: string; at: number } | null>(null);
  useEffect(() => {
    if (!poked) return;
    const done = window.setTimeout(() => setPoked(null), 2600);
    return () => window.clearTimeout(done);
  }, [poked]);
  // The agent saying thanks gets picked, so its bubble is the one in view.
  const answered = useAnsweredSince(agents.map((agent) => `${agent.id}:${agent.status}`).join(","), (ids) => {
    const first = agents.findIndex((agent) => ids.includes(agent.id));
    if (first >= 0) setIndex(first);
  });

  if (agents.length === 0) {
    return (
      <p className="text-[13px] text-zk-muted">
        No agents yet. <Link href="/settings/agents" className="font-semibold text-zk-accent hover:underline">Add one</Link> to work on issues for you.
      </p>
    );
  }

  const agent = agents[Math.min(index, agents.length - 1)];
  const status = STATUS_LABEL[agent.status];
  const working = agent.status === "working";
  const bench = agents.length > 1;
  return (
    <div className="flex flex-col gap-3">
      {bench ? (
        // Wraps rather than scrolls, so a robot's speech bubble isn't clipped.
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose an agent">
          {agents.map((each, i) => {
            const on = i === index;
            const isPoked = poked?.id === each.id;
            return (
              <button
                key={each.id}
                type="button"
                aria-label={`Show ${each.name}`}
                aria-current={on ? "true" : undefined}
                // Choosing a robot also pokes it: it spins and says what it's up to.
                onClick={() => {
                  setIndex(i);
                  setPoked({ id: each.id, at: Date.now() });
                }}
                className={`group relative flex w-[68px] shrink-0 flex-col items-center gap-1 rounded-2xl px-1 pb-1.5 pt-2 focus-visible:outline-2 focus-visible:outline-zk-accent ${
                  on ? "bg-zk-tint ring-1 ring-electric-blue-strong" : "hover:bg-zk-chip"
                }`}
              >
                {answered.has(each.id) ? (
                  <span className="crew-pop absolute -top-1 rounded-full bg-zk-ok-bg px-1.5 text-[10px] font-bold text-zk-ok-fg" aria-hidden="true">
                    Thanks!
                  </span>
                ) : (
                  <SpeechBubble says={agentSays(each)} show={isPoked} />
                )}
                <span
                  key={isPoked ? poked?.at : "still"}
                  className={answered.has(each.id) ? "crew-hop" : isPoked ? "crew-spin" : undefined}
                >
                  <AgentGraphic name={each.name} status={each.status} level={each.level} size={42} />
                </span>
                <span className="max-w-full truncate text-[11px] font-semibold text-zk-text2" aria-hidden="true">
                  {each.name}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex items-start gap-2.5" aria-live="polite">
        {bench ? null : answered.has(agent.id) ? (
          <span className="crew-hop">
            <AgentGraphic name={agent.name} status={agent.status} level={agent.level} size={40} />
          </span>
        ) : (
          <PokeableAgent name={agent.name} status={agent.status} level={agent.level} activity={agent.activity} size={40} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-zk-text">{agent.name}</span>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="ml-auto inline-flex h-6 shrink-0 cursor-not-allowed items-center rounded-full border border-zk-border px-2.5 text-[11px] font-semibold text-zk-text2 opacity-70"
            >
              {working ? "Stop work" : "Work"}
            </button>
            <Link
              href="/settings/agents"
              aria-label={`Manage ${agent.name}`}
              title={`Manage ${agent.name}`}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zk-muted hover:bg-zk-chip hover:text-zk-text focus-visible:outline-2 focus-visible:outline-zk-accent"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </Link>
          </div>
          <span className={`mt-0.5 inline-flex rounded-full px-2 py-px text-[10.5px] font-semibold ${status.tone}`}>{status.label}</span>
          {agent.status === "waiting" ? <QuestionBubble question={agent.question ?? null} /> : null}
          {answered.has(agent.id) ? (
            // Closing the loop: the agent you just answered is back at it.
            <p className="crew-pop mt-1.5 w-fit rounded-xl rounded-tl-sm bg-zk-ok-bg px-2.5 py-1 text-xs font-semibold text-zk-ok-fg">
              Thanks! Back to it.
            </p>
          ) : null}
          <p className="mt-1 truncate text-xs text-zk-text2">{agent.activity}</p>
          <p className="truncate text-[11px] text-zk-muted">{agent.done}</p>
        </div>
      </div>
    </div>
  );
}

/** A waiting agent in its own words: the question it asked, and the way to answer it. */
function QuestionBubble({ question }: { question: { id: string; body: string } | null }) {
  if (!question) {
    return (
      <p className="mt-1.5 w-fit rounded-xl rounded-tl-sm bg-zk-warn-bg px-2.5 py-1 text-xs font-semibold text-zk-warn-fg">
        Psst, I have a question for you.
      </p>
    );
  }
  const text = question.body.trim();
  const preview = text.length > QUESTION_PREVIEW ? `${text.slice(0, QUESTION_PREVIEW).trimEnd()}…` : text;
  return (
    <div className="mt-1.5 flex max-w-full flex-col gap-1.5 rounded-xl rounded-tl-sm bg-zk-warn-bg px-2.5 py-2 text-zk-warn-fg">
      <p className="text-xs font-semibold leading-relaxed">“{preview}”</p>
      <Link
        href={`/escalations/${question.id}`}
        className="inline-flex h-7 w-fit items-center rounded-full bg-zk-warn-fg px-3 text-[11px] font-bold text-zk-surface hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zk-accent"
      >
        Answer
      </Link>
    </div>
  );
}
