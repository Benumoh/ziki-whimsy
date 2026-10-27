import "./crew.css";

export type CrewEyes = "open" | "happy" | "closed" | "wide" | "down";
export type CrewArms = "down" | "wave" | "forward" | "hold";

/** The crew's palette: the same body colors the agent robots use. */
export const CREW_BLUE = "#3978F6";
export const CREW_TEAL = "#0E9F8E";
export const CREW_ORANGE = "#E07A2E";

export const CREW_LIGHT = {
  working: "#22C55E",
  waiting: "#F59E0B",
  idle: "#60A5FA",
  offline: "#94A3B8",
} as const;

/**
 * One crew robot, drawn in a 60×70 box with its feet at y=70, for placing
 * inside a scene's <svg> with `x`/`y`. Same build as the agent robots: an
 * antenna light, a rounded head with a face plate, ears and a small body.
 */
export function CrewBot({
  x = 0,
  y = 0,
  scale = 1,
  color = CREW_BLUE,
  light = CREW_LIGHT.idle,
  eyes = "open",
  arms = "down",
  blink = true,
  className,
}: {
  x?: number;
  y?: number;
  scale?: number;
  color?: string;
  light?: string;
  eyes?: CrewEyes;
  arms?: CrewArms;
  blink?: boolean;
  className?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className={className}>
        <line x1="30" y1="7" x2="30" y2="14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="30" cy="5.5" r="4" fill={light} />
        <rect x="6" y="23" width="4" height="10" rx="2" fill={color} />
        <rect x="50" y="23" width="4" height="10" rx="2" fill={color} />
        <rect x="10" y="14" width="40" height="30" rx="11" fill={color} />
        <rect x="15" y="20" width="30" height="17" rx="8.5" fill="white" opacity="0.94" />
        <Eyes kind={eyes} color={color} blink={blink} />
        <Arms kind={arms} color={color} />
        <rect x="17" y="46" width="26" height="17" rx="6" fill={color} opacity="0.85" />
        <rect x="20" y="63" width="6" height="7" rx="2" fill={color} />
        <rect x="34" y="63" width="6" height="7" rx="2" fill={color} />
      </g>
    </g>
  );
}

function Eyes({ kind, color, blink }: { kind: CrewEyes; color: string; blink: boolean }) {
  if (kind === "closed") {
    return (
      <g stroke={color} strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M20 29 Q 24 31.5 28 29" />
        <path d="M32 29 Q 36 31.5 40 29" />
      </g>
    );
  }
  if (kind === "happy") {
    return (
      <g stroke={color} strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M20.5 30 Q 24 25.5 27.5 30" />
        <path d="M32.5 30 Q 36 25.5 39.5 30" />
      </g>
    );
  }
  const r = kind === "wide" ? 3.6 : 3;
  const cy = kind === "down" ? 30.5 : 28.5;
  return (
    <g fill={color} className={blink ? "crew-blink" : undefined}>
      <circle cx="24" cy={cy} r={r} />
      <circle cx="36" cy={cy} r={r} />
    </g>
  );
}

function Arms({ kind, color }: { kind: CrewArms; color: string }) {
  const arm = { stroke: color, strokeWidth: 4, strokeLinecap: "round" as const, fill: "none" };
  switch (kind) {
    case "wave":
      return (
        <>
          <path d="M17 50 L 10 60" {...arm} />
          <path d="M43 50 L 52 38" {...arm} />
        </>
      );
    case "forward":
      return (
        <>
          <path d="M17 51 L 12 57 L 20 59" {...arm} />
          <path d="M43 51 L 48 57 L 40 59" {...arm} />
        </>
      );
    case "hold":
      return (
        <>
          <path d="M17 50 L 10 60" {...arm} />
          <path d="M43 51 L 52 54" {...arm} />
        </>
      );
    default:
      return (
        <>
          <path d="M17 50 L 11 60" {...arm} />
          <path d="M43 50 L 49 60" {...arm} />
        </>
      );
  }
}
