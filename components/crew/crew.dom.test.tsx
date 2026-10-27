// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, renderHook, waitFor } from "@testing-library/react";
import { CrewScene, type CrewSceneName } from "./crew-scene";
import { useNewPoints } from "./use-new-points";

afterEach(cleanup);

const SCENES: CrewSceneName[] = ["fishing", "napping", "knocking", "searching", "lounging", "dock", "carrying"];

describe("CrewScene", () => {
  it.each(SCENES)("draws the %s scene as decoration only", (scene) => {
    const { container } = render(<CrewScene scene={scene} width={240} />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("data-crew-scene", scene);
    expect(svg).toHaveAttribute("height", "130");
    expect(svg.querySelectorAll("rect").length).toBeGreaterThan(0);
  });
});

describe("useNewPoints", () => {
  beforeEach(() => window.localStorage.clear());

  it("only records a baseline on the first visit", () => {
    const { result } = renderHook(() => useNewPoints(40));
    expect(result.current).toBe(0);
    expect(window.localStorage.getItem("ziki:last-seen-points")).toBe("40");
  });

  it("reports points gained since the last visit, and nothing for a drop", async () => {
    window.localStorage.setItem("ziki:last-seen-points", "10");
    const gained = renderHook(() => useNewPoints(25));
    await waitFor(() => expect(gained.result.current).toBe(15));
    gained.unmount();

    const dropped = renderHook(() => useNewPoints(5));
    expect(dropped.result.current).toBe(0);
    expect(window.localStorage.getItem("ziki:last-seen-points")).toBe("5");
  });
});
