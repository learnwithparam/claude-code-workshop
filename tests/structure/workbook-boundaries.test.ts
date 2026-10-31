import { globSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (glob: string) =>
  globSync(glob)
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");

describe("workbook boundaries", () => {
  it("keeps the API key in api/ and the web app on PUBLIC_API_URL only (R17)", () => {
    const web = read("web/src/**/*.{ts,astro}");
    expect(web).not.toMatch(/ANTHROPIC_API_KEY/);
    expect(read("shared/src/**/*.ts")).not.toMatch(/ANTHROPIC_API_KEY/);
    const names = [...web.matchAll(/import[.]meta[.][e]nv[.](\w+)/g)].map((m) => m[1]);
    expect(names.every((name) => name === "PUBLIC_API_URL")).toBe(true);
  });

  it("lets shared/ decide pagination; the model tool carries content only (R18)", () => {
    const tool = readFileSync("api/src/agent/workbook-agent.ts", "utf8");
    expect(tool).not.toMatch(/maxItemsPerPage|totalPages/);
    expect(readFileSync("shared/src/workbook-plan.ts", "utf8")).toMatch(/maxItemsPerPage/);
  });

  it("keeps the web build static and shows the action from the page (R19)", () => {
    expect(read("web/astro.config.*")).not.toMatch(/output:\s*["'](server|hybrid)/);
    expect(readFileSync("web/src/pages/index.astro", "utf8")).toMatch(/workbook/i);
  });

  it("counts workbook spend in the live-run scripts (R20)", () => {
    expect(readFileSync("api/src/smoke.ts", "utf8")).toMatch(/workbook/i);
    expect(readFileSync("api/src/eval.ts", "utf8")).toMatch(/workbook/i);
  });
});
