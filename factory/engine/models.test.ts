import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../config.ts";
import { badPlanLines } from "./artifacts.ts";
import { fakeHost } from "./fake-host.ts";
import { runWorkflow } from "./interpret.ts";
import { resolveModel } from "./models.ts";
import { globToRegExp, loadPortable, pinPortable, portable } from "./portable.ts";
import { loadWorkflow } from "./workflow.ts";

const cfg = loadConfig();
const small = { ...cfg, spend: { capUsd: 1, stopAt: 0.75 } };
const wf = (steps: string) =>
  loadWorkflow(`name: t\nmethod: m\nsource: s\nfor: f\nsteps:\n${steps}`);

describe("resolveModel", () => {
  it("takes the config model, routes a ticket type, and only then the frontmatter", () => {
    expect(resolveModel({ cfg, step: "build", type: "bug", frontmatter: "haiku" })).toBe(
      "claude-sonnet-5-5",
    );
    expect(resolveModel({ cfg, step: "intent", type: "bug", frontmatter: "sonnet" })).toBe(
      "claude-haiku-5-5",
    );
    expect(resolveModel({ cfg, step: "plan", type: "epic" })).toBe("claude-opus-5-5");
    expect(resolveModel({ cfg, step: "weird", type: "bug", frontmatter: "haiku" })).toBe(
      "claude-haiku-5-5",
    );
    expect(resolveModel({ step: "build", type: "bug" })).toBe("claude-sonnet-5-5");
  });
});

describe("run models and spend", () => {
  const three = wf(
    "  - {stage: intent, agent: planner}\n  - {stage: build, agent: builder}\n  - {stage: review, agent: reviewer}",
  );
  it("hands each step its config model and logs it in run.log and cost.json", async () => {
    const { host, models, files } = fakeHost();
    await runWorkflow(host, three, 7, "t", { config: cfg });
    expect(models).toEqual(["claude-haiku-5-5", "claude-sonnet-5-5", "claude-sonnet-5-5"]);
    expect(files.get("specs/7/run.log")).toContain("intent round 1 model claude-haiku-5-5");
    const cost = JSON.parse(files.get("specs/7/cost.json") ?? "{}");
    expect(cost.calls.map((c: { model: string }) => c.model)).toEqual(models);
    expect(cost.capUsd).toBe(cfg.spend.capUsd);
  });
  it("stops at the configured share of the cap with needs-human and the reason", async () => {
    const { host, calls, files } = fakeHost({ agents: [{ costUsd: 0.8 }] });
    const r = await runWorkflow(host, three, 7, "t", { config: small });
    expect(r.outcome).toBe("needs-human");
    expect(r.reason).toBe("spend cap");
    expect(r.stoppedAt).toBe("build");
    expect(calls.filter((c) => c.startsWith("agent"))).toHaveLength(1);
    expect(files.get("specs/7/run.log")).toContain("needs-human: spend cap");
  });
  it("caps each call at what is left of the run budget", async () => {
    const { host, budgets } = fakeHost({ agents: [{ costUsd: 0.3 }] });
    await runWorkflow(host, three, 7, "t", { config: small });
    expect(budgets[0]).toBe(1);
    expect(budgets[1]).toBeCloseTo(0.7);
  });
  it("counts one cap across the rounds of a looping step", async () => {
    const loop = wf(
      "  - {stage: fix, agent: builder, checks: [green], loop: {until: [green], max: 5}}",
    );
    const { host, calls } = fakeHost({
      agents: [{ costUsd: 0.4 }],
      exec: [{ match: "npx vitest", result: { code: 1, output: "x" } }],
    });
    const r = await runWorkflow(host, loop, 1, "t", { config: small });
    expect(r.reason).toBe("spend cap");
    expect(calls.filter((c) => c.startsWith("agent"))).toHaveLength(2);
  });
});

describe("portable config", () => {
  it("supplies one plan brief to every plan step", () => {
    const plan = wf("  - {stage: plan, agent: planner, writes: plan.md}");
    expect(plan.steps[0]?.brief).toBe(loadPortable().planBrief);
  });
  it("names the key source without holding a key", () => {
    expect(loadPortable().keySource.env).toBe("ANTHROPIC_API_KEY");
    expect(JSON.stringify(loadPortable())).not.toMatch(/sk-ant/);
  });
  it("refuses a plan path matching a protected glob", () => {
    expect(badPlanLines("docs/a.md\nops/x.yml", false, ["ops/**"])).toEqual(["ops/x.yml"]);
    expect(globToRegExp("a/*.ts").test("a/b/c.ts")).toBe(false);
  });
});

describe("pinned portable config", () => {
  it("keeps the commands it read at the start when the file changes later", () => {
    const dir = mkdtempSync(join(tmpdir(), "pin-"));
    const file = join(dir, "config.yaml");
    const original = readFileSync(".factory/config.yaml", "utf8");
    writeFileSync(file, original);
    const pinned = pinPortable(file);
    writeFileSync(file, original.replace(/gate:.*/, "gate: [true]"));
    expect(portable().gate).toEqual(pinned.gate);
    pinPortable();
  });
});
