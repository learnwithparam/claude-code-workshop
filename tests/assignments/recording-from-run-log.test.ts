import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Assignment: a recording made from a real run log. Skipped until you start:
// ASSIGNMENT=1 RUN=<n> npx vitest run tests/assignments/recording-from-run-log.test.ts
const on = process.env.ASSIGNMENT === "1";
const run = process.env.RUN ?? "";

const logLines = (doc: string): string[] => {
  const block = doc.match(/```log\n([\s\S]*?)```/);
  return block?.[1]?.split("\n").filter((l) => l.trim() !== "") ?? [];
};

describe.skipIf(!on)("assignment: record a module from a real run log", () => {
  it("has a run log and a recording for the run you name", () => {
    expect(run, "set RUN=<n>, the spec number of your run").not.toBe("");
    expect(existsSync(`specs/${run}/run.log`)).toBe(true);
    expect(existsSync(`docs/recordings/run-${run}.md`)).toBe(true);
  });

  it("quotes only lines the run really wrote", () => {
    const doc = readFileSync(`docs/recordings/run-${run}.md`, "utf8");
    const real = new Set(readFileSync(`specs/${run}/run.log`, "utf8").split("\n"));
    const quoted = logLines(doc);
    expect(quoted.length).toBeGreaterThan(0);
    expect(quoted.filter((l) => !real.has(l))).toEqual([]);
  });

  it("says what happened and what it proves", () => {
    const doc = readFileSync(`docs/recordings/run-${run}.md`, "utf8");
    expect(doc).toMatch(/^## What happened$/m);
    expect(doc).toMatch(/^## What it proves$/m);
  });
});
