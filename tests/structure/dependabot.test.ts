import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { checkDependabot } from "../../scripts/dependencies.ts";

const entry = (directory: string, interval = "weekly", types = ["minor", "patch"]) => ({
  "package-ecosystem": "npm",
  directory,
  schedule: { interval },
  groups: { all: { "update-types": types } },
});

describe("dependabot config", () => {
  it("flags a manifest directory with no entry", () => {
    expect(checkDependabot({ updates: [entry("/")] }, ["/", "/api"])).toEqual([
      "no dependabot entry for /api",
    ]);
  });

  it("flags a daily schedule and a group that would absorb major bumps", () => {
    const problems = checkDependabot(
      { updates: [entry("/", "daily"), entry("/api", "weekly", ["major", "minor"])] },
      ["/", "/api"],
    );
    expect(problems).toEqual(["/ is not weekly", "/api must group only minor and patch updates"]);
  });

  it("covers the root and every workspace of this repo", () => {
    const config = parse(readFileSync(".github/dependabot.yml", "utf8"));
    const workspaces: string[] = JSON.parse(readFileSync("package.json", "utf8")).workspaces;
    expect(checkDependabot(config, ["/", ...workspaces.map((w) => `/${w}`)])).toEqual([]);
  });
});

// A runner image once resolved Node 22.23.3 while Astro 7 needs 22.23.4, and CI failed on a runner fluke.
describe("workflow Node setup", () => {
  it("asks setup-node for the newest 22.x so a stale runner image cannot fail the build", () => {
    const files = readdirSync(".github/workflows").filter((f) => f.endsWith(".yml"));
    for (const file of files) {
      const jobs = parse(readFileSync(`.github/workflows/${file}`, "utf8")).jobs ?? {};
      for (const job of Object.values<{
        steps?: { uses?: string; with?: Record<string, unknown> }[];
      }>(jobs)) {
        for (const step of job.steps ?? []) {
          if (step.uses?.startsWith("actions/setup-node")) {
            expect(step.with?.["check-latest"], `${file} setup-node`).toBe(true);
          }
        }
      }
    }
  });
});
