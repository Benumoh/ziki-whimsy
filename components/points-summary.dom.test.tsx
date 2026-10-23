// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { PointsSummary } from "./points-summary";

describe("PointsSummary (#428)", () => {
  beforeEach(() => cleanup());

  it("shows the balance, solved tasks and progress toward 35000 points", () => {
    render(<PointsSummary points={17500} solvedTasks={5} />);
    expect(screen.getByText("17500")).toBeInTheDocument();
    expect(screen.getByText("5 solved tasks")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Points" })).toHaveAttribute("aria-valuenow", "17500");
    expect(screen.getByRole("progressbar", { name: "Points" })).toHaveAttribute("aria-valuemax", "35000");
    expect(screen.queryByRole("progressbar", { name: "Solved tasks" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Goal reached/)).not.toBeInTheDocument();
  });

  it("says when 35000 points is reached, with no solved-task requirement", () => {
    render(<PointsSummary points={35000} solvedTasks={0} />);
    expect(screen.getByText(/Goal reached/)).toBeInTheDocument();
  });

  it("links to the leaderboard", () => {
    render(<PointsSummary points={0} solvedTasks={1} />);
    expect(screen.getByText("1 solved task")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Leaderboard" })).toHaveAttribute("href", "/leaderboard");
  });
});
