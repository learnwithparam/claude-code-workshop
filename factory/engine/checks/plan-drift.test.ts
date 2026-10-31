import { describe, expect, it } from "vitest";
import { fakeHost } from "../fake-host.ts";
import { amendmentDigest } from "../plan-amendment.ts";
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

  describe("plan amendment", () => {
    const amend = "- shared/src/b.ts: the band table needs a helper here\n";
    const setup = (over: { amendment?: string; approvals?: string[]; changed?: string[] }) =>
      fakeHost({
        files: {
          "specs/7/plan.md": "shared/src/a.ts",
          ...(over.amendment === undefined ? {} : { "specs/7/plan-amendment.md": over.amendment }),
        },
        changed: over.changed ?? ["shared/src/a.ts", "shared/src/b.ts"],
        approvals: over.approvals,
      });
    const run = (host: ReturnType<typeof setup>["host"]) =>
      planDriftCheck.run({ host, n: 7 } as never);

    it("still fails an unplanned file with no amendment", async () => {
      const r = await run(setup({}).host);
      expect(r.ok).toBe(false);
      expect(r.evidence).toContain("shared/src/b.ts");
    });
    it("passes when an approved amendment lists the file", async () => {
      const approvals = [`7:plan-amendment:${amendmentDigest(amend)}`];
      expect((await run(setup({ amendment: amend, approvals }).host)).ok).toBe(true);
    });
    it("fails when the amendment is not approved", async () => {
      const r = await run(setup({ amendment: amend }).host);
      expect(r.ok).toBe(false);
      expect(r.evidence).toContain("not approved");
    });
    it("auto-approves a low-risk amendment of docs files only", async () => {
      const doc = "- docs/a.md: the guide names the new option\n";
      const { host } = fakeHost({
        files: { "specs/7/plan.md": "docs/b.md", "specs/7/plan-amendment.md": doc },
        changed: ["docs/b.md", "docs/a.md"],
      });
      expect((await run(host)).ok).toBe(true);
    });
    it("refuses a gate-owned path even when the amendment is approved", async () => {
      const bad = "- factory/engine/run.ts: change the runner\n";
      const approvals = [`7:plan-amendment:${amendmentDigest(bad)}`];
      const r = await run(
        setup({ amendment: bad, approvals, changed: ["shared/src/a.ts", "factory/engine/run.ts"] })
          .host,
      );
      expect(r.ok).toBe(false);
      expect(r.evidence).toContain("gate-owned");
    });
    it("refuses an amendment edited after approval", async () => {
      const approvals = [`7:plan-amendment:${amendmentDigest(amend)}`];
      const edited = `${amend}- shared/src/c.ts: added later\n`;
      const r = await run(
        setup({
          amendment: edited,
          approvals,
          changed: ["shared/src/a.ts", "shared/src/b.ts", "shared/src/c.ts"],
        }).host,
      );
      expect(r.ok).toBe(false);
      expect(r.evidence).toContain("not approved");
    });
  });
});
