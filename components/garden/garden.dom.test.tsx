// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { GROWTH_PATH } from "@/lib/issue-garden";
import { IssuePlant } from "./issue-plant";
import { GardenBed } from "./garden-bed";
import { WorkspaceGarden, type GardenCounts } from "./workspace-garden";

afterEach(cleanup);

const empty: GardenCounts = { seed: 0, sprout: 0, sapling: 0, bud: 0, blossom: 0, bloom: 0, fallen: 0, wilting: 0 };

describe("IssuePlant", () => {
  it("is decoration unless given a title", () => {
    const { container, rerender } = render(<IssuePlant growth="bud" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    rerender(<IssuePlant growth="bud" title="Budding" />);
    expect(screen.getByRole("img", { name: "Budding" })).toHaveAttribute("data-growth", "bud");
  });

  it("marks a wilting plant and keeps it still", () => {
    const { container } = render(<IssuePlant growth="sapling" wilting />);
    expect(container.querySelector("svg")).toHaveAttribute("data-wilting", "true");
    expect(container.querySelector(".garden-sway")).toBeNull();
  });
});

describe("GardenBed", () => {
  it("names the issue's stage and shows the whole path", () => {
    const { container } = render(<GardenBed growth="sprout" wiltingDays={null} />);
    expect(screen.getByRole("region", { name: "Issue growth" })).toHaveTextContent("Sprout: Confirmed by reviewers, gathering upvotes.");
    expect(container.querySelectorAll("svg[data-growth]")).toHaveLength(GROWTH_PATH.length);
    expect(screen.queryByText(/Wilting/)).toBeNull();
  });

  it("says how long a stale issue has been wilting", () => {
    render(<GardenBed growth="bud" wiltingDays={21} />);
    expect(screen.getByText(/Wilting: no activity for 21 days/)).toBeInTheDocument();
  });

  it("shows only the fallen leaf for a closed issue", () => {
    const { container } = render(<GardenBed growth="fallen" wiltingDays={null} />);
    expect(container.querySelectorAll("svg[data-growth]")).toHaveLength(1);
    expect(screen.getByText("Fallen leaf")).toBeInTheDocument();
  });
});

describe("WorkspaceGarden", () => {
  it("invites the first issue when nothing is planted", () => {
    render(<WorkspaceGarden counts={empty} />);
    expect(screen.getByRole("link", { name: "Report an issue" })).toHaveAttribute("href", "/issues/new");
  });

  it("counts each stage and the wilting ones", () => {
    render(<WorkspaceGarden counts={{ ...empty, seed: 3, bud: 2, bloom: 5, wilting: 2 }} />);
    expect(screen.getByText("In bloom").previousSibling).toHaveTextContent("5");
    expect(screen.getByText(/2 issues are wilting/)).toBeInTheDocument();
  });
});
