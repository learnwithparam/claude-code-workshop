import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Assignment: seed a 3-sigma breach and run the incident workflow. Skipped until you start:
// ASSIGNMENT=1 ISSUE=<n> npx vitest run tests/assignments/three-sigma-incident.test.ts
const on = process.env.ASSIGNMENT === "1";
const FIXTURE = "fixtures/incidents/breach.json";

type Fixture = {
  metric: string;
  direction: "up-is-bad" | "down-is-bad";
  history: number[];
  latest: number;
};

describe.skipIf(!on)("assignment: a 3-sigma breach becomes an intent", () => {
  it("has a fixture with a metric, a history and a latest value", () => {
    expect(existsSync(FIXTURE)).toBe(true);
    const f = JSON.parse(readFileSync(FIXTURE, "utf8")) as Fixture;
    expect(f.metric).not.toBe("");
    expect(f.history.length).toBeGreaterThanOrEqual(3);
    expect(typeof f.latest).toBe("number");
  });

  it("trips the band at 3 sigma, which the factory answers with an intent", async () => {
    const { detect, actionFor } = await import("../../factory/engine/bands.ts");
    const f = JSON.parse(readFileSync(FIXTURE, "utf8")) as Fixture;
    const breach = detect(f.metric, f.history, f.latest, f.direction);
    expect(breach.sigma).toBeGreaterThanOrEqual(3);
    expect(actionFor(breach)).toBe("intent");
  });

  it("has an intent.md from the incident run that names the metric", () => {
    const issue = process.env.ISSUE ?? "";
    expect(issue, "set ISSUE=<n>, the issue your incident run used").not.toBe("");
    const f = JSON.parse(readFileSync(FIXTURE, "utf8")) as Fixture;
    expect(readFileSync(`specs/${issue}/intent.md`, "utf8")).toContain(f.metric);
  });
});
