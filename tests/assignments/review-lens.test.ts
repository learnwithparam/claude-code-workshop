import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fakeHost } from "../../factory/engine/fake-host.ts";
import { reviewRound } from "../../factory/engine/review.ts";

// Assignment: a new review lens. Skipped until you start: ASSIGNMENT=1 npx vitest run tests/assignments
const on = process.env.ASSIGNMENT === "1";
const LENS = "performance-reviewer";
const finding = {
  file: "api/src/loop.ts",
  line: 12,
  severity: "important",
  claim: "a query inside a loop",
  evidence: "for (const id of ids) await db.get(id)",
};

describe.skipIf(!on)("assignment: performance-reviewer lens", () => {
  it("is an agent file with the read-only tools of the other lenses", () => {
    const text = readFileSync(`.claude/agents/${LENS}.md`, "utf8");
    expect(text).toMatch(/^name: performance-reviewer$/m);
    expect(text).toMatch(/^tools: Read, Grep, Glob$/m);
    expect(text).toMatch(/VERDICT: (clean|blocking)/);
  });

  it("drops a finding that only one voter confirms", async () => {
    const host = fakeHost({
      byAgent: (name) => (name === LENS ? { text: JSON.stringify([finding]) } : undefined),
      agents: [{ text: "yes" }, { text: "no" }, { text: "no" }],
    });
    const round = await reviewRound(host.host, 1, 1, [LENS]);
    expect(round.findings).toEqual([]);
    expect(round.dropped).toBe(1);
  });

  it("is named by at least one workflow's review lenses", () => {
    const dir = ".factory/workflows";
    const named = readdirSync(dir).some((f) => readFileSync(`${dir}/${f}`, "utf8").includes(LENS));
    expect(named).toBe(true);
  });
});
