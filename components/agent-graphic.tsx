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

/**
 * A small robot standing for an agent: its own body color, an antenna light
 * for its status (green working, amber waiting on you, blue standing by,
 * grey offline), and a mood to match. Working, it looks down at its work
 * and its light pulses; waiting on you, it bobs with an "!" over its head;
 * standing by, it smiles; offline, it naps.
 */
export function AgentGraphic({ name, status, size = 40 }: { name: string; status: AgentStatus; size?: number }) {
  const body = colorFor(name);
  const light = LIGHT[status];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0" data-mood={status}>
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
    </svg>
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
