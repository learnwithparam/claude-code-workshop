import { describe, expect, it } from "vitest";
import { cfg, fake, PLAN } from "./fake-deps.ts";
import { runFactory } from "./run.ts";

describe("factory later stages", () => {
  it("runs retro after a build and keeps the outcome when retro fails", async () => {
    const labels = [cfg.labels.approved, cfg.labels.planned];
    const bad = fake(
      { triage: ["TYPE: bug DECISION: proceed"], retro: ["PROPOSAL: {nope"] },
      labels,
    );
    const r = await runFactory(bad.deps, cfg, 1);
    expect(r.outcome).toBe("pr-ready");
    expect(r.retro).toMatch(/^failed/);
    expect(bad.calls.at(-1)).toMatch(/^retro:/);
    const good = fake(
      { triage: ["TYPE: bug DECISION: proceed"], retro: ["PROPOSAL: none"] },
      labels,
    );
    expect((await runFactory(good.deps, cfg, 1)).retro).toBe("none");
  });

  it("does not run retro when no build was attempted", async () => {
    const { deps, calls } = fake({ triage: ["TYPE: bug DECISION: proceed"] });
    await runFactory(deps, cfg, 1);
    expect(calls.some((c) => c.startsWith("retro"))).toBe(false);
  });

  const approved = [cfg.labels.approved, cfg.labels.planned];
  const adrText =
    'CRITICALITY: C2\nADR: {"slug":"x","title":"T","context":"c","decision":"d","consequences":"q"}';

  it("writes no ADR for a C1 change and still opens the PR", async () => {
    const f = fake({ triage: ["TYPE: bug DECISION: proceed"], adr: ["CRITICALITY: C1"] }, approved);
    expect((await runFactory(f.deps, cfg, 1)).outcome).toBe("pr-ready");
    expect(f.adrs).toEqual([]);
  });

  it("writes the next-numbered ADR before the PR opens for C2", async () => {
    const f = fake({ triage: ["TYPE: bug DECISION: proceed"], adr: [adrText] }, approved);
    await runFactory(f.deps, cfg, 1);
    expect(f.adrs).toEqual(["docs/adr/0004-x.md"]);
    expect(f.calls.indexOf("adr:claude-haiku-5-5")).toBeLessThan(f.calls.indexOf("pr"));
  });

  it("hands over to a human, with no PR, when the ADR cannot be parsed", async () => {
    const f = fake({ triage: ["TYPE: bug DECISION: proceed"], adr: ["CRITICALITY: C3"] }, approved);
    const r = await runFactory(f.deps, cfg, 1);
    expect(r.outcome).toBe("needs-human");
    expect(f.calls).not.toContain("pr");
  });

  const facts = (o: object) =>
    `FACTS: ${JSON.stringify([{ number: 4, apiChange: false, small: true, dependsOn: [], ...o }])}`;

  it("records the delivery decision in an epic's plan comment", async () => {
    const f = fake({ triage: ["TYPE: epic DECISION: proceed"], delivery: [facts({})] });
    f.deps.getIssue = async (n) => ({ number: n, title: "t", body: "- [ ] #4 a", labels: [] });
    await runFactory(f.deps, cfg, 1);
    expect(f.comments.at(-1)).toContain("DELIVERY: separate-prs");
  });

  it("hands an epic to a human when the facts cannot be parsed", async () => {
    const f = fake({ triage: ["TYPE: epic DECISION: proceed"], delivery: ["no facts"] });
    const r = await runFactory(f.deps, cfg, 1);
    expect(r.outcome).toBe("needs-human");
    expect(f.calls.some((c) => c.startsWith("build"))).toBe(false);
  });

  it("applies the release only when the approved plan says release", async () => {
    const run = async (plan: string) => {
      const f = fake({ triage: ["TYPE: epic DECISION: proceed"] }, approved, true, plan);
      await runFactory(f.deps, cfg, 1);
      return f.released.length;
    };
    expect(await run(`${PLAN}\n\nDELIVERY: release\nReasons: api`)).toBe(1);
    expect(await run(`${PLAN}\nDELIVERY: separate-prs`)).toBe(0);
    // The runner's form is "\n\nDELIVERY: release\nReasons: ..." at the very end; a bare line is not it.
    expect(await run(`${PLAN}\nDELIVERY: release`)).toBe(0);
    expect(await run(`${PLAN}\n\nDELIVERY: release\nReasons: api\nmore text`)).toBe(0);
  });

  it("drops a DELIVERY line the plan stage wrote, so only the runner's decision is posted", async () => {
    const f = fake({
      triage: ["TYPE: epic DECISION: proceed"],
      plan: ["steps\nDELIVERY: release"],
      delivery: [facts({})],
    });
    f.deps.getIssue = async (n) => ({ number: n, title: "t", body: "- [ ] #4 a", labels: [] });
    await runFactory(f.deps, cfg, 1);
    const posted = f.comments.at(-1) ?? "";
    expect(posted.match(/DELIVERY:/g)).toHaveLength(1);
    expect(posted).toContain("DELIVERY: separate-prs");
  });
});
