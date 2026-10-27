"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ziki:last-seen-points";

/**
 * How many points have landed since this browser last showed the pill, so
 * it can celebrate them once. The first visit only records a baseline, and
 * a blocked or empty storage simply means no celebration.
 */
export function useNewPoints(points: number): number {
  const [gained, setGained] = useState(0);

  useEffect(() => {
    let previous: number | null = null;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      previous = stored === null ? null : Number(stored);
      window.localStorage.setItem(STORAGE_KEY, String(points));
    } catch {
      return;
    }
    if (previous === null || !Number.isFinite(previous) || points <= previous) return;
    const delta = points - previous;
    // Shown on the next tick, after the header has painted, then cleared.
    const show = window.setTimeout(() => setGained(delta), 0);
    const done = window.setTimeout(() => setGained(0), 2400);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(done);
    };
  }, [points]);

  return gained;
}
