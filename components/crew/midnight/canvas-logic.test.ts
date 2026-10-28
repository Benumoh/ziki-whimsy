import { describe, expect, it } from "vitest";
import {
  CANVAS_THEMES,
  codeVerse,
  critique,
  ECO,
  evolveSpecimen,
  generateSpecimen,
  paletteForHour,
  paletteForWeatherCode,
  PALETTES,
  seededRandom,
} from "./canvas-logic";

describe("palettes", () => {
  it("follows the time of day", () => {
    expect(paletteForHour(6).name).toBe("dawn");
    expect(paletteForHour(12).name).toBe("day");
    expect(paletteForHour(18).name).toBe("dusk");
    expect(paletteForHour(23).name).toBe("night");
    expect(paletteForHour(2).name).toBe("night");
  });

  it("maps weather codes onto the six weather palettes", () => {
    expect(paletteForWeatherCode(0).name).toBe("clear");
    expect(paletteForWeatherCode(3).name).toBe("cloudy");
    expect(paletteForWeatherCode(45).name).toBe("fog");
    expect(paletteForWeatherCode(63).name).toBe("rain");
    expect(paletteForWeatherCode(81).name).toBe("rain");
    expect(paletteForWeatherCode(73).name).toBe("snow");
    expect(paletteForWeatherCode(95).name).toBe("storm");
  });
});

describe("specimens", () => {
  it("grows the same garden from the same seed, inside the ecosystem, in the palette's colors", () => {
    const grow = () => {
      const rand = seededRandom(7);
      return Array.from({ length: 12 }, (_, i) => generateSpecimen(rand, i, PALETTES.rain));
    };
    const garden = grow();
    expect(grow()).toEqual(garden);
    for (const s of garden) {
      expect(s.x).toBeGreaterThanOrEqual(ECO.left);
      expect(s.x).toBeLessThanOrEqual(ECO.right);
      expect(PALETTES.rain.colors).toContain(s.color);
      expect(s.generation).toBe(0);
    }
  });

  it("evolves children that stay in the ecosystem and count their generation", () => {
    const rand = seededRandom(3);
    let line = generateSpecimen(rand, 1, PALETTES.night);
    for (let i = 0; i < 20; i++) line = evolveSpecimen(rand, line, i + 2, PALETTES.night);
    expect(line.generation).toBe(20);
    expect(line.x).toBeGreaterThanOrEqual(ECO.left);
    expect(line.y).toBeLessThanOrEqual(ECO.bottom);
    expect(line.scale).toBeGreaterThanOrEqual(0.6);
    expect(line.scale).toBeLessThanOrEqual(1.5);
  });
});

describe("themes", () => {
  const themes = Object.values(CANVAS_THEMES);

  it("gives every empty state its own protocol, seed and opening line", () => {
    for (const key of ["protocol", "seed", "place"] as const) {
      expect(new Set(themes.map((t) => t[key])).size).toBe(themes.length);
    }
    expect(new Set(themes.map((t) => t.opening.join(" "))).size).toBe(themes.length);
  });

  it("gives every empty state its own mix of specimens", () => {
    expect(new Set(themes.map((t) => [...t.kinds].sort().join(","))).size).toBe(themes.length);
  });

  it("grows and evolves only a theme's own kinds, and the critic has a couplet for each", () => {
    for (const theme of themes) {
      const rand = seededRandom(theme.seed);
      let s = generateSpecimen(rand, 1, PALETTES.day, theme.kinds);
      for (let i = 0; i < 30; i++) {
        s = rand() < 0.5 ? evolveSpecimen(rand, s, i + 2, PALETTES.day, theme.kinds) : generateSpecimen(rand, i + 2, PALETTES.day, theme.kinds);
        expect(theme.kinds).toContain(s.kind);
        expect(critique(rand, s)).toHaveLength(3);
      }
    }
  });
});

describe("the critic", () => {
  it("reviews a specimen by name, with a verdict and its lineage", () => {
    const rand = seededRandom(1);
    const parent = generateSpecimen(rand, 1, PALETTES.day);
    const child = evolveSpecimen(rand, parent, 2, PALETTES.day);
    const lines = critique(rand, child);
    expect(lines).toHaveLength(3);
    expect(lines.join(" ")).toMatch(/Verdict:/);
    expect(lines[2]).toContain("Generation 1");
  });

  it("minds its articles", () => {
    const reviews = Array.from({ length: 60 }, (_, i) => {
      const rand = seededRandom(i);
      return critique(rand, generateSpecimen(rand, i, PALETTES.night)).join(" ");
    });
    expect(reviews.some((r) => /\bAn (ambitious|unfinished|ambitious)\b/.test(r))).toBe(true);
    expect(reviews.every((r) => !/\bA [aeiou]/.test(r))).toBe(true);
  });

  it("writes about the real state of the code", () => {
    const verses = Array.from({ length: 40 }, (_, i) =>
      codeVerse(seededRandom(i), { open: 7, waitingOnYou: 2, ideas: 3 }, "rain").join(" "),
    );
    expect(verses.some((v) => v.includes("seven open issues"))).toBe(true);
    expect(verses.some((v) => v.includes("three new ideas"))).toBe(true);
    expect(verses.some((v) => v.includes("Two agents wait"))).toBe(true);
    expect(verses.every((v) => v.length > 0)).toBe(true);
  });

  it("speaks of its own place when a page has no counts to give", () => {
    const verses = Array.from({ length: 20 }, (_, i) => codeVerse(seededRandom(i), null, "dusk", "your notifications").join(" "));
    expect(verses.some((v) => v.includes("your notifications lies empty"))).toBe(true);
    expect(verses.every((v) => !/open issues|new ideas/.test(v))).toBe(true);
  });
});
