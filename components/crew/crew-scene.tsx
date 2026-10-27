import type { ReactNode } from "react";
import { CREW_BLUE, CREW_LIGHT, CREW_ORANGE, CREW_TEAL, CrewBot } from "./crew-bot";

export type CrewSceneName = "fishing" | "napping" | "knocking" | "searching" | "lounging" | "dock" | "carrying";

const ground = { stroke: "var(--zk-border)", strokeWidth: 2, strokeLinecap: "round" as const };

/**
 * A small decorative scene of the agent crew for empty and loading states:
 * the words beside it still say what's going on, so it's hidden from
 * assistive tech. 240×130, scaled to `width`.
 */
export function CrewScene({
  scene,
  width = 200,
  className = "",
}: {
  scene: CrewSceneName;
  width?: number;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={Math.round((width * 130) / 240)}
      viewBox="0 0 240 130"
      aria-hidden="true"
      focusable="false"
      data-crew-scene={scene}
      className={`block max-w-full ${className}`}
    >
      {SCENES[scene]()}
    </svg>
  );
}

const SCENES: Record<CrewSceneName, () => ReactNode> = {
  // Nothing assigned: the robot went fishing.
  fishing: () => (
    <>
      <line x1="16" y1="118" x2="138" y2="118" {...ground} />
      <path d="M140 108 Q 152 102 164 108 T 188 108 T 212 108 T 228 108" fill="none" style={{ stroke: "var(--zk-accent)" }} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      <ellipse cx="190" cy="108" rx="11" ry="3" fill="none" style={{ stroke: "var(--zk-accent)" }} strokeWidth="1.5" className="crew-ripple" />
      <g className="crew-sway">
        <path d="M100 100 Q 140 54 186 38" fill="none" stroke="#8A5A2B" strokeWidth="3" strokeLinecap="round" />
      </g>
      <line x1="186" y1="38" x2="190" y2="100" style={{ stroke: "var(--zk-muted)" }} strokeWidth="1" />
      <g className="crew-bob">
        <circle cx="190" cy="102" r="4.5" fill="#E24B4A" />
        <rect x="186" y="101" width="8" height="2" fill="white" />
      </g>
      <CrewBot x={48} y={48} arms="hold" eyes="open" light={CREW_LIGHT.idle} />
    </>
  ),
  // All caught up: napping.
  napping: () => (
    <>
      <ellipse cx="120" cy="118" rx="54" ry="7" style={{ fill: "var(--zk-tint)" }} />
      <CrewBot x={90} y={49} eyes="closed" light={CREW_LIGHT.offline} blink={false} className="crew-bob" />
      <text x="156" y="46" fontSize="13" fontWeight="700" style={{ fill: "var(--zk-muted)" }} className="crew-z">z</text>
      <text x="166" y="34" fontSize="17" fontWeight="700" style={{ fill: "var(--zk-muted)" }} className="crew-z crew-z-2">Z</text>
    </>
  ),
  // No workspace: knocking on the door.
  knocking: () => (
    <>
      <line x1="20" y1="118" x2="220" y2="118" {...ground} />
      <rect x="152" y="28" width="48" height="90" rx="5" style={{ fill: "var(--zk-tint)", stroke: "var(--zk-border)" }} strokeWidth="2" />
      <rect x="160" y="38" width="32" height="30" rx="3" fill="none" style={{ stroke: "var(--zk-border)" }} strokeWidth="2" />
      <circle cx="191" cy="80" r="3.5" style={{ fill: "var(--zk-muted)" }} />
      <g fill="none" style={{ stroke: "var(--zk-accent)" }} strokeWidth="2" strokeLinecap="round">
        <path d="M140 62 Q 145 70 140 78" className="crew-ripple" />
        <path d="M133 58 Q 140 70 133 82" className="crew-ripple crew-ripple-2" />
      </g>
      <CrewBot x={66} y={48} arms="wave" eyes="open" light={CREW_LIGHT.waiting} />
    </>
  ),
  // No matches: searching with a magnifier.
  searching: () => (
    <>
      <line x1="20" y1="118" x2="220" y2="118" {...ground} />
      <CrewBot x={58} y={48} arms="hold" eyes="wide" light={CREW_LIGHT.idle} />
      <g className="crew-sway">
        <line x1="110" y1="102" x2="128" y2="88" stroke="#8A5A2B" strokeWidth="4" strokeLinecap="round" />
        <circle cx="140" cy="76" r="16" style={{ fill: "var(--zk-tint)", stroke: "var(--zk-accent)" }} strokeWidth="4" />
        <path d="M132 70 Q 136 65 142 65" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      </g>
      <g style={{ fill: "var(--zk-border)" }}>
        <circle cx="176" cy="112" r="3" />
        <circle cx="190" cy="108" r="2" />
        <circle cx="200" cy="113" r="2.5" />
      </g>
    </>
  ),
  // Nobody needs you: two of the crew on a break.
  lounging: () => (
    <>
      <line x1="16" y1="118" x2="224" y2="118" {...ground} />
      <CrewBot x={34} y={48} color={CREW_TEAL} arms="hold" eyes="happy" light={CREW_LIGHT.idle} />
      <rect x="86" y="96" width="13" height="14" rx="3" fill="#F5F7FC" style={{ stroke: "var(--zk-border)" }} strokeWidth="1.5" />
      <path d="M99 99 Q 104 103 99 107" fill="none" style={{ stroke: "var(--zk-border)" }} strokeWidth="1.5" />
      <path d="M90 92 Q 93 88 90 84" fill="none" style={{ stroke: "var(--zk-muted)" }} strokeWidth="1.5" strokeLinecap="round" className="crew-steam" />
      <path d="M95 92 Q 98 88 95 84" fill="none" style={{ stroke: "var(--zk-muted)" }} strokeWidth="1.5" strokeLinecap="round" className="crew-steam crew-z-2" />
      <CrewBot x={140} y={48} color={CREW_BLUE} arms="wave" eyes="happy" light={CREW_LIGHT.idle} className="crew-bob" />
    </>
  ),
  // No agents yet: an empty charging dock.
  dock: () => (
    <>
      <ellipse cx="120" cy="114" rx="46" ry="8" style={{ fill: "var(--zk-tint)", stroke: "var(--zk-accent)" }} strokeWidth="2" strokeDasharray="5 5" />
      <g opacity="0.28" className="crew-bob">
        <CrewBot x={90} y={40} color={CREW_BLUE} eyes="closed" blink={false} light={CREW_LIGHT.offline} />
      </g>
      <path d="M176 112 Q 196 112 198 96 L 198 84" fill="none" style={{ stroke: "var(--zk-muted)" }} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="191" y="72" width="14" height="13" rx="3" style={{ fill: "var(--zk-muted)" }} />
      <line x1="195" y1="66" x2="195" y2="72" style={{ stroke: "var(--zk-muted)" }} strokeWidth="2" strokeLinecap="round" />
      <line x1="201" y1="66" x2="201" y2="72" style={{ stroke: "var(--zk-muted)" }} strokeWidth="2" strokeLinecap="round" />
      <path d="M58 46 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" fill="#F59E0B" className="crew-ripple" />
    </>
  ),
  // Loading: the crew fetching your stuff.
  carrying: () => (
    <>
      <line x1="16" y1="118" x2="224" y2="118" {...ground} />
      <g style={{ fill: "var(--zk-border)" }}>
        <circle cx="74" cy="113" r="4" className="crew-ripple" />
        <circle cx="62" cy="110" r="3" className="crew-ripple crew-ripple-2" />
      </g>
      <g className="crew-walk">
        <CrewBot x={88} y={48} color={CREW_ORANGE} arms="forward" eyes="down" light={CREW_LIGHT.working} />
        <rect x="98" y="94" width="40" height="22" rx="3" fill="#E0B07A" stroke="#B9854C" strokeWidth="1.5" />
        <line x1="118" y1="94" x2="118" y2="104" stroke="#B9854C" strokeWidth="2" />
      </g>
    </>
  ),
};
