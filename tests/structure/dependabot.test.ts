import { readFileSync } from "node:fs";
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
