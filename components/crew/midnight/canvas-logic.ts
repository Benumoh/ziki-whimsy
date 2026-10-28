/**
 * The empty-state canvases: what the two robots do wherever there's nothing
 * to show. The green one grows procedurally drawn "specimens" that live,
 * drift and evolve; the blue one reviews them, and the state of the code, in
 * verse. Each empty state has its own theme (its own protocol, kinds of
 * specimen and seed), so no two look alike. Pure and seeded, so the
 * generation and the poems are unit-tested.
 */

export const SPECIMEN_KINDS = [
  "button", "toggle", "card", "slider", "chip", "sprout", "orb",
  "question", "bubble", "envelope", "bulb", "page", "pencil", "magnifier", "bell", "badge",
  "flag", "shield", "checkbox", "clipboard", "gear", "battery", "bolt", "tent", "brick",
] as const;
export type SpecimenKind = (typeof SPECIMEN_KINDS)[number];

/** One canvas per kind of empty state. */
export type CanvasThemeId =
  | "design" | "inbox" | "ideas" | "drafts" | "filters" | "notifications"
  | "escalations" | "assignments" | "agents" | "workspace" | "project";

export type CanvasTheme = {
  /** The protocol's name, on the canvas's label. */
  protocol: string;
  /** Where it is, for the critic's verse. */
  place: string;
  /** What the green robot makes here. */
  kinds: SpecimenKind[];
  /** The critic's opening line, before anything has grown. */
  opening: string[];
  /** Each theme grows its own garden. */
  seed: number;
};

export const CANVAS_THEMES: Record<CanvasThemeId, CanvasTheme> = {
  design: {
    protocol: "Midnight Canvas", place: "the design queue", seed: 20261028,
    kinds: ["button", "toggle", "card", "slider", "chip", "orb"],
    opening: ["The design queue is empty. How thrilling.", "Let us begin."],
  },
  inbox: {
    protocol: "Quiet Inbox", place: "your Inbox", seed: 41,
    kinds: ["question", "bubble", "envelope"],
    opening: ["No agent has a question now.", "So I'll ask some, and wonder how."],
  },
  ideas: {
    protocol: "Idea Greenhouse", place: "the list of new ideas", seed: 73,
    kinds: ["bulb", "sprout", "orb"],
    opening: ["No new ideas? Then we'll grow our own.", "Water, light, and a little tone."],
  },
  drafts: {
    protocol: "Draft Atelier", place: "the drafts drawer", seed: 97,
    kinds: ["page", "pencil", "card"],
    opening: ["The drafts drawer's empty, swept and clean;", "we'll sketch the best you've never seen."],
  },
  filters: {
    protocol: "Lost & Found", place: "this filtered list", seed: 131,
    kinds: ["magnifier", "chip", "question"],
    opening: ["Your filters caught no fish today.", "We'll search the void in our own way."],
  },
  notifications: {
    protocol: "Silent Bell", place: "your notifications", seed: 167,
    kinds: ["bell", "envelope", "badge"],
    opening: ["Not a single ping, not one hello.", "The bells are tuning, soft and slow."],
  },
  escalations: {
    protocol: "All Clear", place: "the escalations", seed: 199,
    kinds: ["flag", "shield", "checkbox"],
    opening: ["No alarms, no fires, no one stuck.", "We'll guard the calm, and wish you luck."],
  },
  assignments: {
    protocol: "Free Afternoon", place: "your assignments", seed: 233,
    kinds: ["checkbox", "clipboard", "pencil"],
    opening: ["Nothing's assigned to you just now.", "We'll fill your list with lists somehow."],
  },
  agents: {
    protocol: "Empty Dock", place: "your empty agent dock", seed: 271,
    kinds: ["gear", "battery", "bolt"],
    opening: ["No agents docked, the bays are bare.", "We'll charge the batteries with care."],
  },
  workspace: {
    protocol: "New Frontier", place: "a world without a workspace", seed: 307,
    kinds: ["tent", "flag", "brick"],
    opening: ["No workspace yet, just open land.", "We'll pitch the tents and draw it planned."],
  },
  project: {
    protocol: "First Brick", place: "this brand-new project", seed: 349,
    kinds: ["brick", "sprout", "bulb"],
    opening: ["A project with no issues, fresh and new;", "we'll lay the bricks before you do."],
  },
};

export type Specimen = {
  id: number;
  kind: SpecimenKind;
  /** Home position inside the ecosystem, in canvas units. */
  x: number;
  y: number;
  scale: number;
  color: string;
  /** A made-up word it carries (a button label, a chip…). */
  word: string;
  /** How many times its line has evolved: a child of a child is generation 2. */
  generation: number;
};

export type Palette = { name: string; colors: string[]; note: string };

/**
 * Time-of-day palettes, the default; weather palettes replace them on request.
 * The canvas has no background of its own, so every color is a mid tone that
 * reads on the light page and on the dark one.
 */
export const PALETTES: Record<string, Palette> = {
  dawn: { name: "dawn", colors: ["#F472B6", "#FB923C", "#E0A100", "#8B5CF6"], note: "dawn light" },
  day: { name: "day", colors: ["#3978F6", "#10B981", "#F59E0B", "#0EA5E9"], note: "full daylight" },
  dusk: { name: "dusk", colors: ["#EC4899", "#F97316", "#8B5CF6", "#E11D48"], note: "dusk" },
  night: { name: "night", colors: ["#3978F6", "#14B8A6", "#8B5CF6", "#F59E0B"], note: "midnight" },
  clear: { name: "clear", colors: ["#F59E0B", "#3978F6", "#0EA5E9", "#10B981"], note: "clear skies" },
  cloudy: { name: "cloudy", colors: ["#64748B", "#94A3B8", "#6366F1", "#0EA5E9"], note: "clouds" },
  rain: { name: "rain", colors: ["#2563EB", "#0284C7", "#06B6D4", "#64748B"], note: "rain" },
  snow: { name: "snow", colors: ["#38BDF8", "#818CF8", "#94A3B8", "#0EA5E9"], note: "snow" },
  storm: { name: "storm", colors: ["#EAB308", "#7C3AED", "#DB2777", "#475569"], note: "a storm" },
  fog: { name: "fog", colors: ["#9CA3AF", "#A78BFA", "#6B7280", "#F472B6"], note: "fog" },
};

export function paletteForHour(hour: number): Palette {
  if (hour >= 5 && hour < 8) return PALETTES.dawn;
  if (hour >= 8 && hour < 17) return PALETTES.day;
  if (hour >= 17 && hour < 20) return PALETTES.dusk;
  return PALETTES.night;
}

/** Open-Meteo's WMO weather codes, folded into the six weather palettes. */
export function paletteForWeatherCode(code: number): Palette {
  if (code === 0 || code === 1) return PALETTES.clear;
  if (code === 2 || code === 3) return PALETTES.cloudy;
  if (code === 45 || code === 48) return PALETTES.fog;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return PALETTES.snow;
  if (code >= 95) return PALETTES.storm;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return PALETTES.rain;
  return PALETTES.cloudy;
}

/** A small seeded random source (mulberry32), so a seed always grows the same garden. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SYLLABLES = ["zo", "ki", "lu", "mi", "pa", "ra", "no", "vi", "sel", "dra", "qu", "bo"];

function word(rand: () => number): string {
  const n = 2 + Math.floor(rand() * 2);
  const w = Array.from({ length: n }, () => SYLLABLES[Math.floor(rand() * SYLLABLES.length)]).join("");
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)];
}

/** The ecosystem's floor, in canvas units: specimens live between the two robots. */
export const ECO = { left: 130, right: 470, top: 40, bottom: 175 };

const DESIGN_KINDS = CANVAS_THEMES.design.kinds;

export function generateSpecimen(
  rand: () => number,
  id: number,
  palette: Palette,
  kinds: readonly SpecimenKind[] = DESIGN_KINDS,
): Specimen {
  return {
    id,
    kind: pick(rand, kinds),
    x: Math.round(ECO.left + rand() * (ECO.right - ECO.left)),
    y: Math.round(ECO.top + rand() * (ECO.bottom - ECO.top)),
    scale: Math.round((0.75 + rand() * 0.6) * 100) / 100,
    color: pick(rand, palette.colors),
    word: word(rand),
    generation: 0,
  };
}

/**
 * A child of a specimen: mostly like its parent (same family, nearby), with
 * a mutation or two: a new color, a new shape, a name with a syllable more.
 */
export function evolveSpecimen(
  rand: () => number,
  parent: Specimen,
  id: number,
  palette: Palette,
  kinds: readonly SpecimenKind[] = DESIGN_KINDS,
): Specimen {
  const mutateKind = rand() < 0.35;
  return {
    id,
    kind: mutateKind ? pick(rand, kinds) : parent.kind,
    x: clamp(parent.x + Math.round((rand() - 0.5) * 90), ECO.left, ECO.right),
    y: clamp(parent.y + Math.round((rand() - 0.5) * 50), ECO.top, ECO.bottom),
    scale: clamp(Math.round((parent.scale + (rand() - 0.5) * 0.3) * 100) / 100, 0.6, 1.5),
    color: rand() < 0.5 ? pick(rand, palette.colors) : parent.color,
    word: rand() < 0.4 ? parent.word + pick(rand, SYLLABLES) : parent.word,
    generation: parent.generation + 1,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

const ADJECTIVES = ["timid", "brazen", "luminous", "unfinished", "suspicious", "tender", "ambitious", "melancholy"];
const VERDICTS = [
  "Verdict: four stars, would merge at dawn.",
  "Verdict: bold. Perhaps too bold.",
  "Verdict: needs more padding, and more love.",
  "Verdict: I wept. Ship it to no one.",
  "Verdict: derivative of itself, yet fresh.",
  "Verdict: a triumph of the in-between.",
];

/** "A timid", "An ambitious": the article that fits the adjective. */
function withArticle(adjective: string): string {
  return `${/^[aeiou]/i.test(adjective) ? "An" : "A"} ${adjective}`;
}

const COUPLETS: Record<SpecimenKind, (s: Specimen, adj: string) => [string, string]> = {
  button: (s, adj) => [`${withArticle(adj)} button labelled "${s.word}",`, "it begs for clicks, yet none occurred."],
  toggle: (s) => [`This toggle, "${s.word}", can't decide;`, "it flips to on, then runs to hide."],
  card: (s, adj) => [`${withArticle(adj)} card, a tiny stage,`, `with "${s.word}" written on its page.`],
  slider: (s) => ["The slider leans from left to right,", `it measures ${s.word.toLowerCase()} by candlelight.`],
  chip: (s) => [`A chip that only reads "${s.word}",`, "the boldest label ever heard."],
  sprout: (s) => ["A sprout of pixels breaks the ground,", `the first green "${s.word}" this sprint has found.`],
  orb: (s, adj) => [`${withArticle(adj)} orb that hums and glows,`, `where "${s.word}" is going, no one knows.`],
  question: (s, adj) => [`${withArticle(adj)} question mark named "${s.word}",`, "still waiting for a word unheard."],
  bubble: (s) => [`A speech balloon that says "${s.word}",`, "the quietest reply I've heard."],
  envelope: (s, adj) => [`${withArticle(adj)} envelope, sealed and neat,`, `addressed to "${s.word}", on no street.`],
  bulb: (s) => [`A bulb called "${s.word}" flickers bright,`, "an idea no one wrote tonight."],
  page: (s) => [`A page titled "${s.word}", mostly blank,`, "a draft too shy to ever rank."],
  pencil: (s) => [`A pencil, "${s.word}", sharpened, keen,`, "it sketches things not yet foreseen."],
  magnifier: (s) => [`A lens that searches for "${s.word}",`, "and finds a filter, not a word."],
  bell: (s, adj) => [`${withArticle(adj)} bell that will not ring,`, `it hums "${s.word}" and not a thing.`],
  badge: (s) => [`A badge that counts to zero, "${s.word}",`, "the calmest number ever heard."],
  flag: (s) => [`A flag named "${s.word}" stands tall and still,`, "no alarm raised, and none will."],
  shield: (s) => [`A shield called "${s.word}" guards the gate,`, "though nothing's urgent, nothing's late."],
  checkbox: (s) => [`A checkbox, "${s.word}", ticked with care,`, "for tasks that simply are not there."],
  clipboard: (s, adj) => [`${withArticle(adj)} clipboard, "${s.word}", clean,`, "the freest list I've ever seen."],
  gear: (s) => [`A gear called "${s.word}" turns alone,`, "it waits for agents of its own."],
  battery: (s) => [`A battery, "${s.word}", charged and full,`, "for agents yet to pair and pull."],
  bolt: (s) => [`A bolt of "${s.word}", crackling, spare,`, "the dock is ready, no one's there."],
  tent: (s) => [`A tent called "${s.word}" on open land,`, "a workspace waiting to be planned."],
  brick: (s) => [`A brick named "${s.word}", the very first,`, "for issues yet to be rehearsed."],
};

/** The critic on one specimen: a rhyming couplet, then a verdict. */
export function critique(rand: () => number, specimen: Specimen): string[] {
  const [a, b] = COUPLETS[specimen.kind](specimen, pick(rand, ADJECTIVES));
  const lineage = specimen.generation > 0 ? ` (Generation ${specimen.generation}.)` : "";
  return [a, b, `${pick(rand, VERDICTS)}${lineage}`];
}

export type CodeState = { open: number; waitingOnYou: number; ideas: number };

/**
 * The critic on where it is ("this queue", "your notifications"…) and, where
 * the page knows them, the workspace's real counts.
 */
export function codeVerse(rand: () => number, state: CodeState | null, paletteNote: string, place = "this queue"): string[] {
  const verses: string[][] = [
    [`Here ${place} lies empty, clean, and wide,`, "with nothing filed and none to guide.", `So I review what wasn't sent, by ${paletteNote}, and am content.`],
    ["Not one thing waits for you just here;", "the green one builds, I sip, I cheer.", "Verdict on the void: spacious, honest, very still."],
  ];
  if (state) {
    const issues = state.open === 1 ? "one open issue sleeps" : `${spell(state.open)} open issues sleep`;
    const ideas = state.ideas === 1 ? "one new idea" : `${spell(state.ideas)} new ideas`;
    verses.push(
      [`Tonight ${issues} below,`, `and ${place} has nothing here to show.`, `So I review what wasn't sent, by ${paletteNote}, and am content.`],
      ["The queue is empty, clean, and wide;", `${ideas} wait just outside.`, "Until a human's draft appears, I'll critique ghosts and dry my tears."],
      [
        state.waitingOnYou > 0
          ? `${capital(spell(state.waitingOnYou))} ${state.waitingOnYou === 1 ? "agent waits" : "agents wait"} for your reply,`
          : "No agent waits for your reply,",
        "the build is green, or so they lie.",
        "I'll hum in hex until you're back: #3978F6, and a snack.",
      ],
    );
  }
  return pick(rand, verses);
}

const NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
function spell(n: number): string {
  return NUMBERS[n] ?? String(n);
}
function capital(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
