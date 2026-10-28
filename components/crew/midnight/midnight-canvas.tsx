"use client";

import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { CREW_BLUE, CREW_LIGHT, CREW_TEAL, CrewBot } from "@/components/crew/crew-bot";
import {
  codeVerse,
  critique,
  evolveSpecimen,
  generateSpecimen,
  paletteForHour,
  seededRandom,
  CANVAS_THEMES,
  type CanvasThemeId,
  type CodeState,
  type Palette,
  type Specimen,
} from "./canvas-logic";
import { useWeatherPalette } from "./use-weather-palette";
import "./midnight.css";

const W = 600;
const H = 220;
const MAX_SPECIMENS = 9;
/** A tick: one birth or evolution, and now and then a new review. */
const TICK_MS = 2600;
/** Faster while the human is moving the cursor about: the canvas notices. */
const BUSY_TICK_MS = 1400;

/**
 * The empty-state canvas (Protocol Midnight Canvas, on the design queue).
 * The green robot grows procedurally drawn specimens that drift toward your
 * cursor and evolve into children; the blue robot reviews them, and the
 * state of the code, in verse. Each empty state has its own theme, so what
 * grows and what the critic says differs page to page. Colors follow the
 * time of day, or your local weather if you ask. It runs until something
 * real arrives (the list replaces it), can be paused, and holds still under
 * reduced motion.
 */
export function MidnightCanvas({
  codeState = null,
  theme: themeId = "design",
}: {
  /** The workspace's real counts, where the page has them; the critic writes about them. */
  codeState?: CodeState | null;
  /** Which empty state this is: its protocol, what grows, and where the critic is. */
  theme?: CanvasThemeId;
}) {
  const theme = CANVAS_THEMES[themeId];
  const [hour, setHour] = useState<number | null>(null);
  const weather = useWeatherPalette();
  const palette: Palette = weather.palette ?? paletteForHour(hour ?? 0);

  const rand = useRef(seededRandom(theme.seed));
  const nextId = useRef(1);
  const lastMove = useRef(0);
  const [specimens, setSpecimens] = useState<Specimen[]>([]);
  const [review, setReview] = useState<string[]>(theme.opening);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);
  const [sparks, setSparks] = useState(0);

  // The clock and the motion preference are only known in the browser.
  useEffect(() => {
    const ready = window.setTimeout(() => {
      setHour(new Date().getHours());
      setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }, 0);
    return () => window.clearTimeout(ready);
  }, []);

  // Seed the ecosystem once the palette is known, with a first review.
  useEffect(() => {
    if (hour === null) return;
    const seed = window.setTimeout(() => {
      setSpecimens((current) =>
        current.length ? current : Array.from({ length: 4 }, () => generateSpecimen(rand.current, nextId.current++, palette, theme.kinds)),
      );
      setReview(codeVerse(rand.current, codeState, palette.note, theme.place));
    }, 0);
    return () => window.clearTimeout(seed);
    // Only on first knowing the hour; the palette's later changes recolor new growth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour]);

  // The loop: grow or evolve a specimen each tick, and review now and then.
  useEffect(() => {
    if (hour === null || paused || still) return;
    const busy = Date.now() - lastMove.current < 4000;
    const tick = window.setTimeout(() => {
      const r = rand.current;
      const child =
        specimens.length > 2 && r() < 0.45
          ? evolveSpecimen(r, specimens[Math.floor(r() * specimens.length)], nextId.current++, palette, theme.kinds)
          : generateSpecimen(r, nextId.current++, palette, theme.kinds);
      setSpecimens([...specimens, child].slice(-MAX_SPECIMENS));
      if (r() < 0.5) {
        setReview(critique(r, child));
        setReviewing(child.id);
      } else if (r() < 0.25) {
        setReview(codeVerse(r, codeState, palette.note, theme.place));
        setReviewing(null);
      }
    }, busy ? BUSY_TICK_MS : TICK_MS);
    return () => window.clearTimeout(tick);
  }, [hour, paused, still, specimens, palette, codeState, theme]);

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const now = Date.now();
    if (now - lastMove.current < 120) return;
    lastMove.current = now;
    const box = event.currentTarget.getBoundingClientRect();
    setCursor({ x: Math.round(((event.clientX - box.left) / box.width) * W), y: Math.round(((event.clientY - box.top) / box.height) * H) });
  }

  function burst() {
    const r = rand.current;
    setSpecimens((current) =>
      [...current, ...Array.from({ length: 3 }, () => generateSpecimen(r, nextId.current++, palette, theme.kinds))].slice(-MAX_SPECIMENS),
    );
    setSparks(Date.now());
    setReview(["A burst! Three at once! Unseemly.", "Yet I cannot look away.", "Verdict: chaos, beautifully kerned."]);
    setReviewing(null);
  }

  function reviewOne(specimen: Specimen) {
    setReview(critique(rand.current, specimen));
    setReviewing(specimen.id);
  }

  const maxGeneration = specimens.reduce((max, s) => Math.max(max, s.generation), 0);
  const moving = !paused && !still;

  return (
    <section aria-label={`Protocol ${theme.protocol}`} className="mx-auto w-full max-w-[640px] text-left">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-zk-tint px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-zk-accent">
          Protocol: {theme.protocol}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <WeatherControl weather={weather} />
          {still ? null : (
            <button
              type="button"
              onClick={() => setPaused(!paused)}
              className="inline-flex h-7 items-center rounded-full border border-zk-border bg-zk-surface px-3 text-[11px] font-bold text-zk-text2 hover:text-zk-text"
            >
              {paused ? "Resume" : "Pause"}
            </button>
          )}
        </div>
      </div>

      {/* No background of its own: the robots and their pieces stand on the page itself. */}
      <div className={`relative ${paused ? "mc-paused" : ""}`}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`The green robot has grown ${specimens.length} imaginary pieces in ${palette.note}; the blue robot is reviewing them.`}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setCursor(null)}
        >

          {specimens.map((s) => {
            const pull = cursor ? lean(s, cursor) : { dx: 0, dy: 0 };
            return (
              <g key={s.id} className="mc-drift" style={{ transform: `translate(${s.x + pull.dx}px, ${s.y + pull.dy}px)` }}>
                <g
                  className="mc-born cursor-pointer"
                  tabIndex={0}
                  role="button"
                  aria-label={`Ask the critic about "${s.word}", a ${s.kind}`}
                  onClick={() => reviewOne(s)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      reviewOne(s);
                    }
                  }}
                >
                  <g transform={`scale(${s.scale})`}>
                    <SpecimenShape specimen={s} highlighted={reviewing === s.id} />
                  </g>
                </g>
              </g>
            );
          })}

          {/* The generator: click it for a burst. */}
          <g
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label="Ask the green robot for a burst of new pieces"
            onClick={burst}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                burst();
              }
            }}
          >
            <g className={moving ? "mc-work" : undefined}>
              <CrewBot x={30} y={120} scale={1.25} color={CREW_TEAL} light={CREW_LIGHT.working} eyes="down" arms="forward" blink={false} />
            </g>
            {sparks ? (
              <g key={sparks}>
                {[[-20, -30], [10, -38], [30, -18]].map(([dx, dy], i) => (
                  <circle key={i} cx="108" cy="160" r="3" fill={palette.colors[i % palette.colors.length]} className="mc-spark" style={{ ["--mc-dx" as string]: `${dx}px`, ["--mc-dy" as string]: `${dy}px` }} />
                ))}
              </g>
            ) : null}
          </g>

          {/* The critic. */}
          <CrewBot x={500} y={120} scale={1.25} color={CREW_BLUE} light={CREW_LIGHT.idle} eyes="happy" arms="wave" className={moving ? "crew-bob" : undefined} />
        </svg>

        {/* Below the canvas on narrow screens, where an overlay would hide the critic itself; floating over it on wider ones. */}
        <figure
          className="mt-1 rounded-2xl border border-zk-border bg-zk-surface px-3 py-2 text-[11.5px] leading-snug text-zk-text shadow-[0_8px_24px_rgba(11,23,51,0.12)] sm:absolute sm:right-2 sm:top-0 sm:mt-0 sm:max-w-[290px] sm:rounded-br-sm">
          <figcaption className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-zk-accent">The critic</figcaption>
          <blockquote key={review.join("|")} className="mc-born italic">
            {review.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </blockquote>
        </figure>
      </div>

      <p className="mt-1.5 text-center font-mono text-[10.5px] text-zk-muted" aria-hidden="true">
        telemetry · cursor {cursor ? `${cursor.x},${cursor.y}` : "away"} · {specimens.length} specimens · gen {maxGeneration} · palette {palette.note}
        {paused ? " · paused" : ""}
      </p>
    </section>
  );
}

/** A specimen leans a little toward the cursor, more when it's close. */
function lean(s: Specimen, cursor: { x: number; y: number }): { dx: number; dy: number } {
  const dx = cursor.x - s.x;
  const dy = cursor.y - s.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const pull = Math.min(14, 1400 / distance) / distance;
  return { dx: Math.round(dx * pull), dy: Math.round(dy * pull) };
}

/** Each kind of specimen, drawn around (0,0). */
function SpecimenShape({ specimen: s, highlighted }: { specimen: Specimen; highlighted: boolean }) {
  const ink = "#0B1733";
  const ring = highlighted ? <circle r="30" fill="none" stroke={s.color} strokeWidth="1.5" strokeDasharray="3 4" opacity="0.9" /> : null;
  switch (s.kind) {
    case "button":
      return (
        <g>
          {ring}
          <rect x="-28" y="-10" width="56" height="20" rx="10" fill={s.color} />
          <text y="3.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#FFFFFF">{s.word}</text>
        </g>
      );
    case "toggle":
      return (
        <g>
          {ring}
          <rect x="-15" y="-8" width="30" height="16" rx="8" fill={s.color} opacity="0.45" />
          <g className="mc-flip">
            <circle r="6.5" fill={s.color} stroke="#FFFFFF" strokeWidth="1.5" />
          </g>
        </g>
      );
    case "card":
      return (
        <g>
          {ring}
          <rect x="-26" y="-18" width="52" height="36" rx="6" fill="#FFFFFF" stroke={s.color} strokeWidth="1.5" />
          <rect x="-26" y="-18" width="52" height="9" rx="4" fill={s.color} />
          <text x="-21" y="2" fontSize="7.5" fontWeight="800" fill={ink}>{s.word}</text>
          <rect x="-21" y="7" width="30" height="3" rx="1.5" fill="#CBD5E1" />
        </g>
      );
    case "slider":
      return (
        <g>
          {ring}
          <line x1="-26" y1="0" x2="26" y2="0" stroke={s.color} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
          <g className="mc-slide">
            <circle r="5.5" fill="#FFFFFF" stroke={s.color} strokeWidth="2.5" />
          </g>
        </g>
      );
    case "chip":
      return (
        <g>
          {ring}
          <rect x="-24" y="-8" width="48" height="16" rx="8" fill="none" stroke={s.color} strokeWidth="1.8" />
          <text y="3" textAnchor="middle" fontSize="8" fontWeight="800" fill={s.color}>{s.word}</text>
        </g>
      );
    case "sprout":
      return (
        <g className="mc-sway">
          {ring}
          <path d="M0 14 L0 -6" stroke={s.color} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M0 2 Q -10 -2 -11 -10 Q -3 -8 0 2" fill={s.color} />
          <path d="M0 -3 Q 10 -7 11 -15 Q 3 -13 0 -3" fill={s.color} />
        </g>
      );
    case "question":
      return (
        <g className="mc-sway">
          {ring}
          <circle r="13" fill={s.color} />
          <text y="5.5" textAnchor="middle" fontSize="16" fontWeight="900" fill="#FFFFFF">?</text>
        </g>
      );
    case "bubble":
      return (
        <g>
          {ring}
          <path d="M-22 -14 H22 a6 6 0 0 1 6 6 V6 a6 6 0 0 1 -6 6 H-6 L-14 19 L-13 12 H-22 a6 6 0 0 1 -6 -6 V-8 a6 6 0 0 1 6 -6 Z" fill={s.color} />
          {[-10, 0, 10].map((x, i) => (
            <circle key={x} cx={x} cy="-1" r="2.6" fill="#FFFFFF" className="mc-glow" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
        </g>
      );
    case "envelope":
      return (
        <g>
          {ring}
          <rect x="-24" y="-15" width="48" height="30" rx="3" fill="#FFFFFF" stroke={s.color} strokeWidth="1.8" />
          <path d="M-24 -14 L0 4 L24 -14" fill="none" stroke={s.color} strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="0" cy="4" r="3" fill={s.color} />
        </g>
      );
    case "bulb":
      return (
        <g>
          {ring}
          <circle cy="-4" r="17" fill={s.color} opacity="0.25" className="mc-glow" />
          <circle cy="-4" r="11" fill={s.color} />
          <rect x="-5.5" y="7" width="11" height="8" rx="2" fill="#94A3B8" />
          <path d="M-3 -6 Q0 -10 3 -6" stroke="#FFFFFF" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      );
    case "page":
      return (
        <g>
          {ring}
          <path d="M-17 -22 H9 L17 -14 V22 H-17 Z" fill="#FFFFFF" stroke={s.color} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 -22 V-14 H17" fill="none" stroke={s.color} strokeWidth="1.6" />
          <text x="-12" y="-9" fontSize="6.5" fontWeight="800" fill={ink}>{s.word}</text>
          {[-1, 6, 13].map((y, i) => (
            <rect key={y} x="-12" y={y} width={i === 2 ? 14 : 24} height="2.5" rx="1.2" fill="#CBD5E1" />
          ))}
        </g>
      );
    case "pencil":
      return (
        <g>
          {ring}
          {/* The CSS sway would replace a transform on the same element, so the tilt sits outside it. */}
          <g transform="rotate(-35)">
            <g className="mc-sway">
              <rect x="-22" y="-5" width="34" height="10" rx="2" fill={s.color} />
              <rect x="-26" y="-5" width="5" height="10" rx="1.5" fill="#F472B6" />
              <path d="M12 -5 L24 0 L12 5 Z" fill="#F5D0A9" />
              <path d="M20.5 -1.5 L24 0 L20.5 1.5 Z" fill={ink} />
            </g>
          </g>
        </g>
      );
    case "magnifier":
      return (
        <g className="mc-sway">
          {ring}
          <circle cx="-4" cy="-4" r="12" fill="#FFFFFF" fillOpacity="0.5" stroke={s.color} strokeWidth="3.5" />
          <line x1="5" y1="5" x2="17" y2="17" stroke={s.color} strokeWidth="5" strokeLinecap="round" />
          <path d="M-10 -8 Q-8 -12 -4 -12" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </g>
      );
    case "bell":
      return (
        <g>
          {ring}
          <g className="mc-sway">
            <path d="M-14 8 Q-14 -16 0 -16 Q14 -16 14 8 L17 12 H-17 Z" fill={s.color} />
            <circle cy="-18" r="2.5" fill={s.color} />
            <circle cy="15" r="3.5" fill={s.color} />
          </g>
        </g>
      );
    case "badge":
      return (
        <g>
          {ring}
          <circle r="13" fill={s.color} className="mc-glow" opacity="0.3" />
          <circle r="10" fill={s.color} />
          <text y="4" textAnchor="middle" fontSize="11" fontWeight="900" fill="#FFFFFF">0</text>
        </g>
      );
    case "flag":
      return (
        <g>
          {ring}
          <line x1="-12" y1="-20" x2="-12" y2="20" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
          <g className="mc-sway">
            <path d="M-11 -19 Q0 -24 9 -18 Q17 -13 22 -17 V-1 Q17 3 9 -2 Q0 -8 -11 -3 Z" fill={s.color} />
          </g>
        </g>
      );
    case "shield":
      return (
        <g>
          {ring}
          <path d="M0 -20 L16 -14 V0 Q16 13 0 20 Q-16 13 -16 0 V-14 Z" fill={s.color} />
          <path d="M-7 0 L-2 5 L8 -6" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "checkbox":
      return (
        <g>
          {ring}
          <rect x="-12" y="-12" width="24" height="24" rx="5" fill={s.color} />
          <path d="M-6 0 L-1.5 5 L7 -5" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mc-glow" />
        </g>
      );
    case "clipboard":
      return (
        <g>
          {ring}
          <rect x="-16" y="-20" width="32" height="40" rx="4" fill={s.color} />
          <rect x="-12" y="-14" width="24" height="31" rx="2" fill="#FFFFFF" />
          <rect x="-7" y="-23" width="14" height="7" rx="2.5" fill="#64748B" />
          {[-8, -1, 6].map((y) => (
            <g key={y}>
              <rect x="-9" y={y} width="4" height="4" rx="1" fill="none" stroke={s.color} strokeWidth="1.2" />
              <rect x="-3" y={y + 1} width="12" height="2.2" rx="1.1" fill="#CBD5E1" />
            </g>
          ))}
        </g>
      );
    case "gear":
      return (
        <g>
          {ring}
          <g className="mc-spin">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <rect key={angle} x="-3.5" y="-17" width="7" height="8" rx="1.5" fill={s.color} transform={`rotate(${angle})`} />
            ))}
            <circle r="12" fill={s.color} />
            <circle r="4.5" fill="#FFFFFF" />
          </g>
        </g>
      );
    case "battery":
      return (
        <g>
          {ring}
          <rect x="-20" y="-10" width="36" height="20" rx="4" fill="none" stroke={s.color} strokeWidth="2.2" />
          <rect x="17" y="-4" width="4" height="8" rx="1.5" fill={s.color} />
          <rect x="-16" y="-6" width="28" height="12" rx="2" fill={s.color} className="mc-glow" />
        </g>
      );
    case "bolt":
      return (
        <g>
          {ring}
          <polygon points="4,-22 -12,3 -1,3 -5,22 12,-4 1,-4" fill={s.color} className="mc-glow" />
        </g>
      );
    case "tent":
      return (
        <g>
          {ring}
          <path d="M0 -18 L22 16 H-22 Z" fill={s.color} />
          <path d="M0 -2 L8 16 H-8 Z" fill="#FFFFFF" opacity="0.85" />
          <line x1="0" y1="-18" x2="0" y2="-24" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" />
          <g className="mc-sway">
            <path d="M0 -24 L9 -22 L0 -19 Z" fill={s.color} />
          </g>
        </g>
      );
    case "brick":
      return (
        <g>
          {ring}
          <rect x="-22" y="-11" width="44" height="22" rx="2.5" fill={s.color} />
          <line x1="-22" y1="0" x2="22" y2="0" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.7" />
          <line x1="0" y1="-11" x2="0" y2="0" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.7" />
          <line x1="-11" y1="0" x2="-11" y2="11" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.7" />
          <line x1="11" y1="0" x2="11" y2="11" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.7" />
        </g>
      );
    default:
      return (
        <g>
          {ring}
          <circle r="14" fill={s.color} className="mc-glow" />
          <circle r="8" fill={s.color} />
          <circle cx="-2.5" cy="-2.5" r="2.4" fill="#FFFFFF" opacity="0.8" />
        </g>
      );
  }
}


/** "Match my weather": an opt-in city, then the palette follows its current weather. */
function WeatherControl({ weather }: { weather: ReturnType<typeof useWeatherPalette> }) {
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState("");
  // Several canvases can share a page, so each city field gets its own id.
  const cityId = useId();
  if (weather.place) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zk-text2">
        Painting with {weather.palette?.note} in {weather.place}
        <button type="button" onClick={weather.clear} className="font-bold text-zk-accent hover:underline">
          Use time of day
        </button>
      </span>
    );
  }
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-7 items-center rounded-full border border-zk-border bg-zk-surface px-3 text-[11px] font-bold text-zk-text2 hover:text-zk-text"
      >
        Match my weather
      </button>
    );
  }
  return (
    <form
      className="inline-flex items-center gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        if (city.trim()) weather.lookUp(city.trim());
      }}
    >
      <label className="sr-only" htmlFor={cityId}>
        Your city, for the weather palette
      </label>
      <input
        id={cityId}
        value={city}
        onChange={(event) => setCity(event.target.value)}
        placeholder="Your city"
        maxLength={80}
        className="h-7 w-32 rounded-full border border-zk-border bg-zk-surface px-3 text-[11px] text-zk-text outline-none focus:border-electric-blue"
      />
      <button type="submit" disabled={weather.loading} className="inline-flex h-7 items-center rounded-full bg-electric-blue-strong px-3 text-[11px] font-bold text-white disabled:opacity-60">
        {weather.loading ? "Looking…" : "Paint"}
      </button>
      {weather.error ? <span role="alert" className="text-[11px] font-semibold text-zk-bad-fg">{weather.error}</span> : null}
    </form>
  );
}
