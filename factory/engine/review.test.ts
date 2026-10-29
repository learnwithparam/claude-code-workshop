import { describe, expect, it } from "vitest";
import { actionFor, detect, intentFor } from "./bands.ts";
import { mergeQueue, release } from "./deploy.ts";
import { fakeHost } from "./fake-host.ts";
import { reviewLoop, reviewRound } from "./review.ts";
import { approvalsMet, classify } from "./risk.ts";

const finding = {
  file: "a.ts",
  line: 3,
  severity: "important",
  claim: "unchecked",
  evidence: "x=null",
};

describe("review", () => {
  it("drops a finding with one vote and keeps one with two", async () => {
    const voted = (yes: number) => {
      let i = 0;
      return fakeHost({
        agents: [
          { text: JSON.stringify([finding]) },
          ...Array.from({ length: 3 }, () => ({ text: i++ < yes ? "yes" : "no" })),
        ],
      });
    };
    // lens call is first; the three ballots follow. Votes are consumed in order.
    const one = voted(1);
    expect((await reviewRound(one.host, 1, 1, ["reviewer"])).dropped).toBe(1);
    const two = voted(2);
    expect((await reviewRound(two.host, 1, 1, ["reviewer"])).findings).toHaveLength(1);
  });
  it("ignores a finding with no evidence", async () => {
    const { host } = fakeHost({
      agents: [{ text: JSON.stringify([{ ...finding, evidence: "" }]) }],
    });
    expect((await reviewRound(host, 1, 1, ["reviewer"])).findings).toHaveLength(0);
  });
  it("keeps an unfixed important finding open until the cap, then hands it to a human", async () => {
    let fixed = 0;
    const { host } = fakeHost({
      byAgent: (name) => ({ text: name === "verifier" ? "yes" : JSON.stringify([finding]) }),
    });
    const r = await reviewLoop(host, 1, ["reviewer"], async () => void fixed++);
    expect(r).toEqual({ clean: false, rounds: 3 });
    expect(fixed).toBe(2);
  });
  it("treats a reply that is not findings as a failed review, not a clean one", async () => {
    const { host } = fakeHost({ agents: [{ text: "looks fine to me" }] });
    expect(await reviewLoop(host, 1, ["reviewer"], async () => {})).toEqual({
      clean: false,
      rounds: 1,
    });
  });
});

describe("risk", () => {
  it("is high for a CI workflow and low for docs", () => {
    expect(classify([".github/workflows/ci.yml"])).toBe("high");
    expect(classify(["docs/a.md", "src/a.ts"])).toBe("medium");
    expect(classify(["docs/a.md", "specs/1/plan.md"])).toBe("low");
  });
  it("treats markdown that steers an agent as high, whatever the casing or dots", () => {
    for (const f of [
      "CLAUDE.md",
      ".claude/agents/builder.md",
      "./Claude.MD",
      "docs/../.claude/skills/x/SKILL.md",
      "Makefile",
      "scripts/a.ts",
    ])
      expect(classify([f])).toBe("high");
  });
  it("never counts an agent, and voids approval after a new commit", () => {
    const a = [{ by: "bot", kind: "agent" as const, commit: "c1" }];
    expect(approvalsMet("medium", a, "c1")).toBe(false);
    const h = [{ by: "ana", kind: "human" as const, commit: "c1" }];
    expect(approvalsMet("medium", h, "c1")).toBe(true);
    expect(approvalsMet("medium", h, "c2")).toBe(false);
    expect(approvalsMet("high", h, "c1")).toBe(false);
  });
});

describe("deploy", () => {
  it("refuses production without approvals before running anything", async () => {
    const { host, calls } = fakeHost();
    expect((await release(host, "production", "medium", [], "c1")).ok).toBe(false);
    expect(calls).toHaveLength(0);
    expect((await release(host, "preview", "high", [], "c1")).ok).toBe(true);
  });
  it("merge queue fails when the gate fails on latest main", async () => {
    const { host } = fakeHost({
      exec: [{ match: "make check", result: { code: 1, output: "red" } }],
    });
    expect((await mergeQueue(host)).ok).toBe(false);
  });
});

describe("bands", () => {
  const hist = [10, 11, 9, 10, 10, 11, 9];
  it("a 3 sigma breach writes an intent", () => {
    const b = detect("ci-failure-rate", hist, 30, "up-is-bad");
    expect(actionFor(b)).toBe("intent");
    expect(intentFor(b)).toContain("outside its band");
  });
  it("a value inside the band does nothing", () => {
    expect(actionFor(detect("ci-failure-rate", hist, 10, "up-is-bad"))).toBe("none");
  });
});
