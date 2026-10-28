// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { InboxAgents } from "./inbox-agents";

afterEach(cleanup);
beforeEach(() => window.localStorage.clear());

const agents = [
  {
    id: "a1",
    name: "Scout",
    status: "waiting" as const,
    activity: "Waiting for your answer",
    done: "Last 30 days: 2 confirmed",
    question: { id: "q1", body: "Should I start with the login timeout or the CSV export?" },
  },
  { id: "a2", name: "Pixel", status: "working" as const, activity: "Working on #2 Filter", done: "Nothing done in the last 30 days" },
];

const details = () => screen.getByText("Waiting on you", { exact: false }).closest("[aria-live]") as HTMLElement;

describe("InboxAgents", () => {
  it("shows the whole crew on a bench, and the chosen agent's details", () => {
    render(<InboxAgents agents={agents} />);
    const bench = screen.getByRole("group", { name: "Choose an agent" });
    expect(within(bench).getByRole("button", { name: "Show Scout" })).toHaveAttribute("aria-current", "true");
    expect(within(bench).getByRole("button", { name: "Show Pixel" })).toBeInTheDocument();
    expect(bench.querySelectorAll("svg[data-mood]")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Work" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Show Pixel" }));
    // The details, and the poked robot saying the same thing over its head.
    expect(document.querySelector("[aria-live]")).toHaveTextContent("Working on #2 Filter");
    expect(within(bench).getByText("Working on #2 Filter")).toHaveClass("block");
    // A working agent offers Stop work; still not wired up.
    expect(screen.getByRole("button", { name: "Stop work" })).toHaveAttribute("title", "Coming soon");
    expect(screen.getByRole("button", { name: "Show Pixel" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Manage Pixel" })).toHaveAttribute("href", "/settings/agents");
  });

  it("quotes a waiting agent's question, with the way to answer it", () => {
    render(<InboxAgents agents={agents} />);
    expect(within(details()).getByText("“Should I start with the login timeout or the CSV export?”")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Answer" })).toHaveAttribute("href", "/escalations/q1");

    fireEvent.click(screen.getByRole("button", { name: "Show Pixel" }));
    expect(screen.queryByRole("link", { name: "Answer" })).toBeNull();
  });

  it("falls back to a nudge when the question itself isn't known", () => {
    render(<InboxAgents agents={[{ ...agents[0], question: null }]} />);
    expect(screen.getByText("Psst, I have a question for you.")).toBeInTheDocument();
  });

  it("thanks you once after you answer an agent that was waiting", async () => {
    window.localStorage.setItem("ziki:crew-waiting", JSON.stringify(["a1"]));
    const answered = [{ ...agents[0], status: "working" as const, activity: "Working on #4 Login", question: null }, agents[1]];
    render(<InboxAgents agents={answered} />);
    await waitFor(() => expect(screen.getByText("Thanks! Back to it.")).toBeInTheDocument());
    expect(window.localStorage.getItem("ziki:crew-waiting")).toBe("[]");

    cleanup();
    render(<InboxAgents agents={answered} />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText("Thanks! Back to it.")).toBeNull();
  });

  it("has no bench for a single agent, and invites adding one when there are none", () => {
    const { rerender } = render(<InboxAgents agents={agents.slice(0, 1)} />);
    expect(screen.queryByRole("group", { name: "Choose an agent" })).toBeNull();
    expect(document.querySelector("svg[data-mood]")).toHaveAttribute("data-mood", "waiting");
    rerender(<InboxAgents agents={[]} />);
    expect(screen.getByText(/No agents yet/)).toBeInTheDocument();
  });
});
