import type { ReactNode } from "react";
import type { Growth } from "@/lib/issue-garden";
import "./garden.css";

const LEAF = "#3F9E4D";
const STEM = "#2F7A3A";
const WILTED_LEAF = "#A89B5E";
const WILTED_STEM = "#8C7F48";
const PETAL = "#F08BB0";
const BLOOM = "#F5A623";
const SEED = "#8A5A2B";

/**
 * An issue drawn as a potted plant at its growth stage, in a 32×32 box. A
 * wilting plant droops and fades. Decorative: the words next to it say the
 * same thing, so it is hidden from assistive tech unless given a `title`.
 */
export function IssuePlant({
  growth,
  wilting = false,
  size = 24,
  title,
  animate = true,
}: {
  growth: Growth;
  wilting?: boolean;
  size?: number;
  /** When set, the plant is announced with this text instead of hidden. */
  title?: string;
  animate?: boolean;
}) {
  const leaf = wilting ? WILTED_LEAF : LEAF;
  const stem = wilting ? WILTED_STEM : STEM;
  const living = growth !== "seed" && growth !== "fallen";
  const plantClass = !wilting && animate && living ? "garden-sway" : undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className="shrink-0"
      data-growth={growth}
      data-wilting={wilting ? "true" : undefined}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      {title ? <title>{title}</title> : null}
      <g transform={wilting && living ? "rotate(28 16 22)" : undefined}>
        <g className={plantClass}>{PLANTS[growth]({ leaf, stem, wilting, animate })}</g>
      </g>
      {/* pot */}
      <path d="M9.5 24.5 L22.5 24.5 L21 31 L11 31 Z" fill="#C2703D" />
      <rect x="8" y="22" width="16" height="3.2" rx="1.2" fill="#D9834A" />
      <ellipse cx="16" cy="22.4" rx="6.6" ry="1.3" fill="#6B4A2E" />
    </svg>
  );
}

type Paint = { leaf: string; stem: string; wilting: boolean; animate: boolean };

const leaves = (leaf: string, y: number, spread = 4) => (
  <>
    <path d={`M16 ${y} Q ${16 - spread} ${y - 1} ${16 - spread - 0.5} ${y - 4} Q ${16 - 1.5} ${y - 3} 16 ${y}`} fill={leaf} />
    <path d={`M16 ${y} Q ${16 + spread} ${y - 1} ${16 + spread + 0.5} ${y - 4} Q ${16 + 1.5} ${y - 3} 16 ${y}`} fill={leaf} />
  </>
);

const stemTo = (stem: string, top: number) => (
  <path d={`M16 22 L16 ${top}`} stroke={stem} strokeWidth="1.6" strokeLinecap="round" fill="none" />
);

const PLANTS: Record<Growth, (paint: Paint) => ReactNode> = {
  seed: () => (
    <>
      <ellipse cx="16" cy="20.6" rx="2.3" ry="1.6" fill={SEED} />
      <path d="M15.2 20 Q 16 19.4 16.8 20" stroke="#C9A27A" strokeWidth="0.6" fill="none" />
    </>
  ),
  sprout: ({ leaf, stem }) => (
    <>
      {stemTo(stem, 17)}
      {leaves(leaf, 18, 3.2)}
    </>
  ),
  sapling: ({ leaf, stem }) => (
    <>
      {stemTo(stem, 11)}
      {leaves(leaf, 19)}
      {leaves(leaf, 14.5, 3.4)}
      <ellipse cx="16" cy="10.4" rx="1.6" ry="2.2" fill={leaf} />
    </>
  ),
  bud: ({ leaf, stem, wilting }) => (
    <>
      {stemTo(stem, 9)}
      {leaves(leaf, 19)}
      {leaves(leaf, 14, 3.4)}
      <ellipse cx="16" cy="7.4" rx="2.4" ry="3.4" fill={wilting ? "#C9A0AE" : PETAL} />
      <path d="M13.8 9 Q 16 11.2 18.2 9 Q 16 10 13.8 9" fill={leaf} />
    </>
  ),
  blossom: ({ leaf, stem, wilting }) => (
    <>
      {stemTo(stem, 9)}
      {leaves(leaf, 19)}
      {leaves(leaf, 14, 3.4)}
      <g fill={wilting ? "#C9A0AE" : PETAL}>
        <ellipse cx="13.6" cy="7.6" rx="2.2" ry="3.2" transform="rotate(-28 13.6 7.6)" />
        <ellipse cx="18.4" cy="7.6" rx="2.2" ry="3.2" transform="rotate(28 18.4 7.6)" />
        <ellipse cx="16" cy="6.4" rx="2.2" ry="3.4" />
      </g>
      <circle cx="16" cy="9" r="1.4" fill={BLOOM} />
    </>
  ),
  bloom: ({ leaf, stem, animate }) => (
    <>
      {stemTo(stem, 10)}
      {leaves(leaf, 19)}
      {leaves(leaf, 14.5, 3.4)}
      <g className={animate ? "garden-breathe" : undefined}>
        <g fill={BLOOM}>
          <circle cx="16" cy="4.6" r="2.7" />
          <circle cx="12.6" cy="7.1" r="2.7" />
          <circle cx="19.4" cy="7.1" r="2.7" />
          <circle cx="13.9" cy="10.9" r="2.7" />
          <circle cx="18.1" cy="10.9" r="2.7" />
        </g>
        <circle cx="16" cy="8" r="2.2" fill="#7A4A12" />
      </g>
    </>
  ),
  fallen: () => (
    <path d="M12 21.2 Q 15 18 20.5 19.6 Q 17 22.6 12 21.2 Z M12.6 21 L 19.6 19.8" fill="#B5793C" stroke="#8A5A2B" strokeWidth="0.5" />
  ),
};
