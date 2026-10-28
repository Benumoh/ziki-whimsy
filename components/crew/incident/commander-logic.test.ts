import { describe, expect, it } from "vitest";
import { draftResolution, escalationTelemetry, parseEscalation, simulateOptions } from "./commander-logic";

const REX = "Should I start with the login timeout or the CSV export? I'd pick the timeout: more people hit it.";

describe("parseEscalation", () => {
  it("finds the options and matches the agent's lean to one of them", () => {
    expect(parseEscalation(REX)).toEqual({
      options: ["the login timeout", "the CSV export"],
      pick: "the login timeout",
      reason: "more people hit it",
    });
  });

  it("reads three options and no lean", () => {
    const parsed = parseEscalation("Context first. Do we focus on search, filters or the export first?");
    expect(parsed.options).toEqual(["search", "filters", "the export"]);
    expect(parsed.pick).toBeNull();
  });

  it("keeps the verbs of options that are actions", () => {
    expect(parseEscalation("Should I fix the line endings or switch to the shared CSV writer?").options).toEqual([
      "fix the line endings",
      "switch to the shared CSV writer",
    ]);
  });

  it("finds nothing to weigh in a plain question", () => {
    expect(parseEscalation("Which locale should the dates use?")).toEqual({ options: [], pick: null, reason: null });
  });
});

describe("escalationTelemetry", () => {
  const at = (minutes: number) => new Date(Date.UTC(2026, 9, 1, 0, minutes));

  it("counts, takes the median reply time, and keeps the latest answer", () => {
    const telemetry = escalationTelemetry([
      { createdAt: at(0), answeredAt: at(10), answer: "older" },
      { createdAt: at(100), answeredAt: at(130), answer: "newest" },
      { createdAt: at(200), answeredAt: null, answer: null },
    ]);
    expect(telemetry).toEqual({ asked: 3, answered: 2, medianMinutes: 20, lastAnswer: "newest" });
  });

  it("has no history for a first escalation", () => {
    expect(escalationTelemetry([])).toEqual({ asked: 0, answered: 0, medianMinutes: null, lastAnswer: null });
  });
});

describe("simulateOptions", () => {
  it("shares out 100, the same way every time, with the agent's pick nudged ahead", () => {
    const run = () => simulateOptions(["the login timeout", "the CSV export"], "the login timeout", "q-1");
    const results = run();
    expect(run()).toEqual(results);
    expect(results.reduce((sum, r) => sum + r.score, 0)).toBe(100);
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
  });

  it("has nothing to simulate without options", () => {
    expect(simulateOptions([], null, "q-1")).toEqual([]);
  });
});

describe("draftResolution", () => {
  it("answers a choice with the simulation's winner, then the rest, and a client update", () => {
    const parsed = parseEscalation(REX);
    const simulation = [
      { option: "the login timeout", score: 61 },
      { option: "the CSV export", score: 39 },
    ];
    const draft = draftResolution({ kind: "Question", agent: "Rex", parsed, simulation, issue: { number: 42, title: "Login times out" } });
    expect(draft.answer).toBe("First: the login timeout. Your reasoning holds: more people hit it. Then: the CSV export.");
    expect(draft.patch[0]).toEqual({ sign: "-", text: "status: waiting on a human" });
    expect(draft.patch).toContainEqual({ sign: "+", text: "then: the CSV export" });
    expect(draft.clientUpdate).toContain('"Login times out" (#42)');
  });

  it("drafts for each kind of escalation without options", () => {
    const parsed = parseEscalation("I'm stuck on the auth migration.");
    for (const kind of ["Blocker", "Work Authorization", "Scope Expansion", "Human Approval", "Question"] as const) {
      const draft = draftResolution({ kind, agent: "Rex", parsed, simulation: [], issue: null });
      expect(draft.answer.length).toBeGreaterThan(10);
      expect(draft.patch.at(-1)).toEqual({ sign: "+", text: "status: back to work" });
      expect(draft.clientUpdate).toContain("your request");
    }
  });
});
