// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AgentGraphic } from "@/components/agent-graphic";
import { EscalationRobot } from "@/app/(app)/escalations/[id]/escalation-robot";
import { agentSays } from "./agent-says";
import { PokeableAgent } from "./pokeable-agent";

afterEach(cleanup);

describe("robots acting out their job", () => {
  it.each([
    ["contributor", "hammer"],
    ["reviewer", "magnifier"],
    ["triager", "clipboard"],
    ["merger", "stamp"],
    ["dispatcher", "megaphone"],
    ["observer", "binoculars"],
  ])("a working %s holds a %s", (level, tool) => {
    const { container } = render(<AgentGraphic name="Rex" status="working" level={level} />);
    expect(container.querySelector("svg")).toHaveAttribute("data-tool", tool);
  });

  it("only works with a tool while working", () => {
    const { container } = render(<AgentGraphic name="Rex" status="idle" level="reviewer" />);
    expect(container.querySelector("svg")).not.toHaveAttribute("data-tool");
  });
});

describe("agentSays", () => {
  it("names a working agent's job and the issue in its own words", () => {
    expect(agentSays({ status: "working", level: "reviewer", activity: "Working on #12 CSV export" })).toBe("Reviewing #12 CSV export");
    expect(agentSays({ status: "working", level: null, activity: "Working on #3 Login" })).toBe("Working on #3 Login");
    expect(agentSays({ status: "waiting", activity: "Waiting for your answer" })).toBe("I've got a question for you!");
    expect(agentSays({ status: "offline", activity: "No recent activity" })).toMatch(/napping/);
  });
});

describe("PokeableAgent", () => {
  it("says what it's doing as its name, and spins and speaks when poked", () => {
    render(<PokeableAgent name="Rex" status="working" level="contributor" activity="Working on #4 Login" />);
    const robot = screen.getByRole("button", { name: "Rex: Fixing #4 Login" });
    expect(robot.querySelector(".crew-spin")).toBeNull();
    fireEvent.click(robot);
    expect(robot.querySelector(".crew-spin")).not.toBeNull();
    expect(screen.getByText("Fixing #4 Login")).toHaveClass("block");
  });
});

describe("EscalationRobot", () => {
  it("waits until you answer, then thanks you right away", async () => {
    const { rerender } = render(<EscalationRobot name="Rex" level="contributor" answered={false} />);
    expect(screen.getByText("Waiting for your call…")).toBeInTheDocument();
    rerender(<EscalationRobot name="Rex" level="contributor" answered />);
    await waitFor(() => expect(screen.getByText("Thanks! Back to it.")).toBeInTheDocument());
    expect(document.querySelector("svg[data-mood]")).toHaveAttribute("data-mood", "working");
  });

  it("doesn't cheer when you come back to an answered escalation", async () => {
    render(<EscalationRobot name="Rex" level="contributor" answered />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.getByText("Got your answer. On it.")).toBeInTheDocument();
  });
});
