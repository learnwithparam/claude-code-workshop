import { describe, expect, it } from "vitest";
import { type ImpactMap, parseImpact, planChecks } from "./impact.ts";

const map: ImpactMap = {
  always: ["lint"],
  workspaces: { shared: ["t-shared"], web: ["t-web", "build-web"], api: ["t-api"] },
  paths: {
    "shared/**": ["shared", "web", "api"],
    "web/**": ["web"],
    "api/**": ["api"],
    "docs/**": [],
  },
};

describe("impact map", () => {
  it("runs only the web checks for a web change", () => {
    expect(planChecks(map, ["web/src/a.ts"])).toEqual({
      full: false,
      commands: ["lint", "t-web", "build-web"],
    });
  });

  it("escalates to the full gate for a path the map does not cover", () => {
    expect(planChecks(map, ["web/a.ts", "Makefile"])).toEqual({
      full: true,
      commands: ["make check"],
    });
  });

  it("makes a shared change also run the web and api checks, each once", () => {
    const { commands } = planChecks(map, ["shared/bands.ts", "web/a.ts"]);
    expect(commands).toEqual(["lint", "t-shared", "t-web", "build-web", "t-api"]);
  });

  it("runs only lint for a docs change and nothing for no change", () => {
    expect(planChecks(map, ["docs/a.md"]).commands).toEqual(["lint"]);
    expect(planChecks(map, []).commands).toEqual([]);
  });

  it("rejects a path that names a workspace with no checks", () => {
    expect(() =>
      parseImpact({ impact: { always: [], workspaces: {}, paths: { "web/**": ["web"] } } }),
    ).toThrow(/unknown workspace web/);
  });
});
