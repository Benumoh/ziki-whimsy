"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  draftResolution,
  parseEscalation,
  simulateOptions,
  type EscalationKind,
  type IssueRef,
  type Telemetry,
} from "./commander-logic";
import "./incident.css";

/** How long each stage takes on screen. */
const STAGE_MS = 750;
const STAGES = [
  "Parsing the escalation",
  "Querying past escalations",
  "Running the diagnostic simulation",
  "Drafting the patch",
  "Writing the client update",
] as const;

/**
 * Protocol: Autonomous Incident Commander, on an open escalation. The agent
 * doesn't wait: the moment the page opens it reads its own question, looks
 * back over its owner's earlier answers, simulates the options, and lays out
 * a drafted answer, plan patch and client update. "Use this answer" puts the
 * draft in the response box; nothing is sent until the human sends it.
 */
export function IncidentCommander({
  escalationId,
  agent,
  kind,
  body,
  issue,
  telemetry,
}: {
  escalationId: string;
  agent: string;
  kind: EscalationKind;
  body: string;
  issue: IssueRef;
  telemetry: Telemetry;
}) {
  const parsed = useMemo(() => parseEscalation(body), [body]);
  const simulation = useMemo(() => simulateOptions(parsed.options, parsed.pick, escalationId), [parsed, escalationId]);
  const resolution = useMemo(
    () => draftResolution({ kind, agent, parsed, simulation, issue }),
    [kind, agent, parsed, simulation, issue],
  );

  // Rendered finished on the server and without scripts; the run replays once the browser has it.
  const [stage, setStage] = useState<number>(STAGES.length);
  const [filled, setFilled] = useState(true);
  const [used, setUsed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers = [
      window.setTimeout(() => {
        setStage(0);
        setFilled(false);
      }, 0),
      ...STAGES.map((_, i) => window.setTimeout(() => setStage(i + 1), STAGE_MS * (i + 1))),
      window.setTimeout(() => setFilled(true), STAGE_MS * 3),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  function fillAnswer() {
    const box = document.getElementById("answer");
    if (!(box instanceof HTMLTextAreaElement)) return;
    box.value = resolution.answer;
    box.focus();
    box.scrollIntoView({ block: "center", behavior: "smooth" });
    setUsed(true);
  }

  async function copyUpdate() {
    try {
      await navigator.clipboard.writeText(resolution.clientUpdate);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard (an insecure page, a denied permission): the text is on screen to copy by hand.
    }
  }

  const done = stage >= STAGES.length;
  const parseLog = [
    `type: ${kind}`,
    parsed.options.length ? `${parsed.options.length} options found` : "no options to weigh",
    parsed.pick ? `${agent} leans toward ${parsed.pick}` : null,
    issue ? `issue #${issue.number}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const historyLog = telemetry.asked
    ? `${telemetry.asked} earlier ${telemetry.asked === 1 ? "escalation" : "escalations"} · ${telemetry.answered} answered${
        telemetry.medianMinutes !== null ? ` · usual reply in ${duration(telemetry.medianMinutes)}` : ""
      }`
    : `first escalation from ${agent}: no history yet`;

  return (
    <section aria-labelledby="ic-heading" className="space-y-3 rounded-[16px] border border-zk-border bg-zk-chip/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="ic-heading" className="rounded-xl bg-zk-tint px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-zk-accent">
          Protocol: Autonomous Incident Commander
        </h2>
        <span className="text-[11px] font-semibold text-zk-muted" aria-live="polite">
          {done ? `Drafted by ${agent} before you got here` : `${agent} is on it…`}
        </span>
      </div>

      <ol className="space-y-2">
        {STAGES.map((label, i) =>
          i > stage ? null : (
            <li key={label} className="icmd-in">
              <div className="flex items-center gap-2 text-xs font-bold text-zk-text">
                <StageMark state={i < stage ? "done" : "running"} />
                {label}
              </div>
              {i < stage ? (
                <div className="ml-6 mt-1">
                  {i === 0 ? <Log>{parseLog}</Log> : null}
                  {i === 1 ? (
                    <Log>
                      {historyLog}
                      {telemetry.lastAnswer ? <span className="block truncate">last reply: “{telemetry.lastAnswer}”</span> : null}
                    </Log>
                  ) : null}
                  {i === 2 ? <Simulation results={simulation} filled={filled} /> : null}
                  {i === 3 ? <Patch lines={resolution.patch} /> : null}
                  {i === 4 ? <p className="rounded-[10px] bg-zk-surface p-2.5 text-xs leading-relaxed text-zk-text">{resolution.clientUpdate}</p> : null}
                </div>
              ) : null}
            </li>
          ),
        )}
      </ol>

      {done ? (
        <div className="icmd-in space-y-2 rounded-[12px] border border-zk-border bg-zk-surface p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-zk-accent">Drafted answer to {agent}</p>
          <p className="text-sm text-zk-text">{resolution.answer}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={fillAnswer}
              className="inline-flex h-8 items-center rounded-full bg-electric-blue-strong px-3.5 text-xs font-bold text-white hover:opacity-90"
            >
              {used ? "In the response box ✓" : "Use this answer"}
            </button>
            <button
              type="button"
              onClick={copyUpdate}
              className="inline-flex h-8 items-center rounded-full border border-zk-border bg-zk-surface px-3.5 text-xs font-bold text-zk-text2 hover:text-zk-text"
            >
              {copied ? "Copied ✓" : "Copy client update"}
            </button>
            <span className="text-[11px] text-zk-muted">A draft: nothing is sent until you send it.</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StageMark({ state }: { state: "done" | "running" }) {
  if (state === "done") {
    return (
      <span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-zk-ok-bg text-[10px] text-zk-ok-fg">
        ✓
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center">
      <span className="icmd-pulse h-2 w-2 rounded-full bg-electric-blue" />
    </span>
  );
}

function Log({ children }: { children: ReactNode }) {
  return <p className="rounded-[10px] bg-zk-surface px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-zk-text2">{children}</p>;
}

function Simulation({ results, filled }: { results: ReturnType<typeof simulateOptions>; filled: boolean }) {
  if (!results.length) return <Log>nothing to simulate: a single path forward</Log>;
  return (
    <div className="space-y-1.5 rounded-[10px] bg-zk-surface p-2.5">
      <p className="font-mono text-[10.5px] text-zk-muted">1,000 simulated runs per option</p>
      {results.map((r, i) => (
        <div key={r.option} className="text-[11px]">
          <div className="flex justify-between gap-2 font-semibold text-zk-text">
            <span className="truncate">{r.option}</span>
            <span className="font-mono">{r.score}%</span>
          </div>
          <div className="relative mt-0.5 h-1.5 overflow-hidden rounded-full bg-zk-chip">
            <div
              className={`icmd-bar h-full rounded-full ${i === 0 ? "bg-electric-blue" : "bg-zk-muted/50"}`}
              style={{ width: filled ? `${r.score}%` : "0%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Patch({ lines }: { lines: { sign: "+" | "-"; text: string }[] }) {
  return (
    <pre className="overflow-x-auto rounded-[10px] bg-zk-surface p-2.5 font-mono text-[11px] leading-relaxed">
      {lines.map((line, i) => (
        <span key={i} className={`block ${line.sign === "+" ? "text-zk-ok-fg" : "text-zk-bad-fg"}`}>
          {line.sign} {line.text}
        </span>
      ))}
    </pre>
  );
}

function duration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} days`;
}
