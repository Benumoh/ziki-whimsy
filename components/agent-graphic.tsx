import type { AgentStatus } from "@/lib/dashboard-overview";
import "@/components/crew/crew.css";

// A body color per agent, picked from its name, so each one looks the same everywhere.
const BODY_COLORS = ["#3978F6", "#7C5CE0", "#0E9F8E", "#E07A2E", "#D04F7A", "#4A5BD4"];
const LIGHT: Record<AgentStatus, string> = {
  working: "#22C55E",
  waiting: "#F59E0B",
  idle: "#60A5FA",
  offline: "#94A3B8",
};

function colorFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return BODY_COLORS[hash % BODY_COLORS.length];
}

/** What a working agent of each level is doing, in a word, for its speech and its tool. */
const TASK: Record<string, { verb: string; tool: Tool }> = {
  contributor: { verb: "Fixing", tool: "hammer" },
  reviewer: { verb: "Reviewing", tool: "magnifier" },
  triager: { verb: "Sorting", tool: "clipboard" },
  merger: { verb: "Merging", tool: "stamp" },
  admin_merger: { verb: "Merging", tool: "stamp" },
  dispatcher: { verb: "Dispatching", tool: "megaphone" },
  observer: { verb: "Watching", tool: "binoculars" },
};
type Tool = "hammer" | "magnifier" | "clipboard" | "stamp" | "megaphone" | "binoculars";

/** "Fixing", "Reviewing"…: the agent's job at its level, or plain "Working on". */
export function agentTaskVerb(level: string | null | undefined): string {
  return (level && TASK[level]?.verb) || "Working on";
}

/**
 * A small robot standing for an agent: its own body color, an antenna light
 * for its status (green working, amber waiting on you, blue standing by,
 * grey offline), and a mood to match. Working, it looks down at its work,
 * its light pulses and it acts out its job with its level's tool (a fixer
 * hammers, a reviewer sweeps a magnifier, a triager ticks a clipboard…);
 * waiting on you, it bobs with an "!" over its head; standing by, it smiles
 * over a mug; offline, it naps.
 */
export function AgentGraphic({
  name,
  status,
  size = 40,
  level,
}: {
  name: string;
  status: AgentStatus;
  size?: number;
  /** The agent's level, for the tool it works with. */
  level?: string | null;
}) {
  const body = colorFor(name);
  const light = LIGHT[status];
  const tool = status === "working" ? (level && TASK[level]?.tool) || "hammer" : null;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0 overflow-visible" data-mood={status} data-tool={tool ?? undefined}>
      <rect x="1" y="1" width="38" height="38" rx="12" fill={body} opacity="0.12" />
      <g className={status === "waiting" ? "crew-bob" : undefined} opacity={status === "offline" ? 0.7 : undefined}>
        {/* antenna */}
        <line x1="20" y1="7" x2="20" y2="12" stroke={body} strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="6" r="2.6" fill={light} className={status === "working" ? "motion-safe:animate-pulse" : undefined} />
        {/* head */}
        <rect x="9" y="12" width="22" height="17" rx="6" fill={body} />
        <rect x="12.5" y="16" width="15" height="8.5" rx="4.25" fill="white" opacity="0.92" />
        <Eyes status={status} color={body} />
        {/* ears */}
        <rect x="6.5" y="17" width="2.5" height="6" rx="1.25" fill={body} />
        <rect x="31" y="17" width="2.5" height="6" rx="1.25" fill={body} />
        {/* body */}
        <rect x="13" y="30" width="14" height="6" rx="3" fill={body} opacity="0.75" />
      </g>
      {status === "waiting" ? (
        <g>
          <circle cx="32.5" cy="7.5" r="5" fill={light} />
          <rect x="31.7" y="4.5" width="1.6" height="4" rx="0.8" fill="white" />
          <circle cx="32.5" cy="10.3" r="0.9" fill="white" />
        </g>
      ) : null}
      {status === "offline" ? (
        <text x="30" y="11" fontSize="7" fontWeight="700" fill={LIGHT.offline} className="crew-z">
          z
        </text>
      ) : null}
      {tool ? <ToolInHand tool={tool} /> : null}
      {status === "idle" ? <Mug /> : null}
    </svg>
  );
}

/** The working agent's tool, in the bottom-right of its tile, moving as it works. */
function ToolInHand({ tool }: { tool: Tool }) {
  const ink = "#0B1733";
  switch (tool) {
    case "magnifier":
      return (
        <g className="crew-scan">
          <circle cx="33" cy="29" r="3.6" fill="#DBE7FD" stroke={ink} strokeWidth="1.4" />
          <line x1="30.4" y1="31.6" x2="27.6" y2="34.6" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      );
    case "clipboard":
      return (
        <g>
          <rect x="28.5" y="25.5" width="9" height="11" rx="1.5" fill="#FFFFFF" stroke={ink} strokeWidth="1.1" />
          <rect x="31" y="24.5" width="4" height="2" rx="0.6" fill={ink} />
          <path d="M30.5 31 l1.8 1.8 l3.4 -3.6" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="crew-check" />
        </g>
      );
    case "stamp":
      return (
        <g className="crew-stamp">
          <rect x="31.5" y="24" width="3" height="6" rx="1.2" fill="#8A5A2B" />
          <rect x="29" y="30" width="8" height="3" rx="1" fill="#E24B4A" />
        </g>
      );
    case "megaphone":
      return (
        <g>
          <path d="M28 30 L34 26.5 L34 34.5 Z" fill="#F5B82E" stroke={ink} strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M36 28 Q 38 30.5 36 33" fill="none" stroke="#F5B82E" strokeWidth="1.2" strokeLinecap="round" className="crew-ripple" />
        </g>
      );
    case "binoculars":
      return (
        <g className="crew-scan">
          <circle cx="30.5" cy="31" r="2.4" fill={ink} />
          <circle cx="35.5" cy="31" r="2.4" fill={ink} />
          <rect x="30.5" y="29.4" width="5" height="1.6" fill={ink} />
        </g>
      );
    default:
      return (
        <g className="crew-hammer">
          <line x1="29" y1="37" x2="34.5" y2="27.5" stroke="#8A5A2B" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="31.5" y="24.5" width="7" height="3.6" rx="0.9" fill="#64748B" transform="rotate(30 35 26.3)" />
        </g>
      );
  }
}

/** Standing by: a mug with a little steam. */
function Mug() {
  return (
    <g>
      <rect x="29.5" y="29.5" width="6" height="6.5" rx="1.4" fill="#FFFFFF" stroke="#0B1733" strokeWidth="0.9" />
      <path d="M35.5 31 Q 37.6 32.7 35.5 34.4" fill="none" stroke="#0B1733" strokeWidth="0.9" />
      <path d="M31.5 28 Q 32.5 26.5 31.5 25" fill="none" stroke="#94A3B8" strokeWidth="0.9" strokeLinecap="round" className="crew-steam" />
    </g>
  );
}

function Eyes({ status, color }: { status: AgentStatus; color: string }) {
  if (status === "idle") {
    return (
      <g stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none">
        <path d="M15.4 21.2 Q 17 18.8 18.6 21.2" />
        <path d="M21.4 21.2 Q 23 18.8 24.6 21.2" />
      </g>
    );
  }
  if (status === "offline") {
    return (
      <g stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none">
        <path d="M15.2 20.2 Q 17 21.6 18.8 20.2" />
        <path d="M21.2 20.2 Q 23 21.6 24.8 20.2" />
      </g>
    );
  }
  const cy = status === "working" ? 21.3 : 20.25;
  const r = status === "waiting" ? 2.2 : 1.9;
  return (
    <g fill={color} className="crew-blink">
      <circle cx="17" cy={cy} r={r} />
      <circle cx="23" cy={cy} r={r} />
    </g>
  );
}
