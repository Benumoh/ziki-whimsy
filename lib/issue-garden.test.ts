import { describe, expect, it } from "vitest";
import { growthOf, wiltingDays, WILT_AFTER_DAYS } from "./issue-garden";

describe("growthOf", () => {
  it("grows an open issue with its intake stage", () => {
    expect(growthOf({ status: "open", stage: "reported" })).toBe("seed");
    expect(growthOf({ status: "open", stage: null })).toBe("seed");
    expect(growthOf({ status: "open", stage: "confirmed" })).toBe("sprout");
    expect(growthOf({ status: "open", stage: "ready" })).toBe("sapling");
  });

  it("buds once someone works on it, and blossoms when the fix is ready to merge", () => {
    expect(growthOf({ status: "open", stage: "ready", working: true })).toBe("bud");
    expect(growthOf({ status: "in_progress", stage: null })).toBe("bud");
    expect(growthOf({ status: "in_progress", stage: null, reviewStatus: "submitted" })).toBe("bud");
    expect(growthOf({ status: "in_progress", stage: null, reviewStatus: "rejected" })).toBe("bud");
    expect(growthOf({ status: "in_progress", stage: null, reviewStatus: "ready_to_merge" })).toBe("blossom");
  });

  it("blooms when resolved and drops a leaf when closed, whatever the review says", () => {
    expect(growthOf({ status: "resolved", stage: null, reviewStatus: "submitted" })).toBe("bloom");
    expect(growthOf({ status: "closed", stage: null, reviewStatus: "ready_to_merge" })).toBe("fallen");
  });
});

describe("wiltingDays", () => {
  const now = new Date("2026-10-27T12:00:00Z");
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  it("wilts unfinished issues left alone for two weeks or more", () => {
    expect(wiltingDays({ status: "open", updatedAt: daysAgo(WILT_AFTER_DAYS - 1), now })).toBeNull();
    expect(wiltingDays({ status: "open", updatedAt: daysAgo(WILT_AFTER_DAYS), now })).toBe(WILT_AFTER_DAYS);
    expect(wiltingDays({ status: "in_progress", updatedAt: daysAgo(30), now })).toBe(30);
  });

  it("never wilts finished issues", () => {
    expect(wiltingDays({ status: "resolved", updatedAt: daysAgo(90), now })).toBeNull();
    expect(wiltingDays({ status: "closed", updatedAt: daysAgo(90), now })).toBeNull();
  });
});
