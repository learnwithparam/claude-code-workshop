import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../config.ts";
import { fakeHost } from "./fake-host.ts";
import { runWorkflow } from "./interpret.ts";
import { loadWorkflow } from "./workflow.ts";

const cfg = loadConfig();
const docs = loadWorkflow(readFileSync(".factory/workflows/docs.yaml", "utf8"));

describe("the docs workflow routes its write step", () => {
  it("builds the write step on the docs route, and other tickets on the build default", async () => {
    const modelFor = async (type: string) => {
      const { host } = fakeHost({ agents: [{ text: "plan" }] });
      const r = await runWorkflow(host, docs, 1, "t", { config: cfg, ticketType: type });
      return r.calls.find((c) => c.stage === "write")?.model;
    };
    expect(await modelFor("docs")).toBe(cfg.routes.docs?.build);
    expect(await modelFor("docs")).toBe("claude-haiku-5-5");
    expect(await modelFor("bug")).toBe(cfg.stages.build.model);
  });

  it("maps every docs step to a config stage, so none falls back to the agent frontmatter", () => {
    for (const s of docs.steps)
      expect(
        cfg.stepStages[s.stage] ?? (s.stage in cfg.stages ? s.stage : undefined),
        s.stage,
      ).toBeDefined();
  });
});
