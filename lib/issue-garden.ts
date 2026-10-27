import type { IssueStage } from "@/lib/issue-stage";

/**
 * The issue garden: every issue is a plant that grows as the issue moves
 * forward. Purely a way of showing where an issue stands; it adds no state.
 */
export type Growth = "seed" | "sprout" | "sapling" | "bud" | "blossom" | "bloom" | "fallen";

/** The growing order, seed to bloom. A closed issue's fallen leaf is off the path. */
export const GROWTH_PATH: Growth[] = ["seed", "sprout", "sapling", "bud", "blossom", "bloom"];

export const growthLabels: Record<Growth, string> = {
  seed: "Seed",
  sprout: "Sprout",
  sapling: "Sapling",
  bud: "Budding",
  blossom: "Blossoming",
  bloom: "In bloom",
  fallen: "Fallen leaf",
};

/** What each plant means, in the issue's own terms. */
export const growthMeanings: Record<Growth, string> = {
  seed: "Reported, waiting for reviewers to confirm it",
  sprout: "Confirmed by reviewers, gathering upvotes",
  sapling: "Ready for someone to pick up",
  bud: "Being worked on",
  blossom: "Fix approved and ready to merge",
  bloom: "Resolved",
  fallen: "Closed without a fix",
};

/** Open issues untouched this long start to wilt. */
export const WILT_AFTER_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export function growthOf({
  status,
  stage,
  working = false,
  reviewStatus = null,
}: {
  status: string;
  stage: IssueStage | null | undefined;
  /** Someone holds an active claim on it. */
  working?: boolean;
  reviewStatus?: string | null;
}): Growth {
  if (status === "closed") return "fallen";
  if (status === "resolved") return "bloom";
  if (reviewStatus === "ready_to_merge") return "blossom";
  if (working || status === "in_progress" || reviewStatus === "submitted" || reviewStatus === "rejected") return "bud";
  if (stage === "ready") return "sapling";
  if (stage === "confirmed") return "sprout";
  return "seed";
}

/** Whole days an unfinished issue has gone untouched, once it is wilting; otherwise null. */
export function wiltingDays({
  status,
  updatedAt,
  now = new Date(),
}: {
  status: string;
  /** Missing means unknown, which never wilts. */
  updatedAt: Date | null | undefined;
  now?: Date;
}): number | null {
  if (!updatedAt || (status !== "open" && status !== "in_progress")) return null;
  const days = Math.floor((now.getTime() - updatedAt.getTime()) / DAY_MS);
  return days >= WILT_AFTER_DAYS ? days : null;
}
