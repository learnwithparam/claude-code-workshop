import { describe, expect, it } from "vitest";
import { fakeHost } from "../fake-host.ts";
import { planDriftCheck } from "./plan-drift.ts";

describe("plan-drift check", () => {
  it("fails, rather than throws, when the run has no plan", async () => {
    const { host } = fakeHost({ changed: ["shared/src/a.ts"] });
    const r = await planDriftCheck.run({ host, n: 7 } as never);
    expect(r.ok).toBe(false);
    expect(r.evidence).toContain("specs/7/plan.md is missing");
  });
  it("passes when the diff stays inside the plan", async () => {
    const { host } = fakeHost({
      files: { "specs/7/plan.md": "shared/src/a.ts" },
      changed: ["shared/src/a.ts"],
    });
    expect((await planDriftCheck.run({ host, n: 7 } as never)).ok).toBe(true);
  });
});
