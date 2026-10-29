import { describe, expect, it } from "vitest";
import { fakeHost } from "../fake-host.ts";
import { manifestDeps } from "./manifest-deps.ts";

const pkg = (scripts: string, dep: string) =>
  JSON.stringify({ scripts: { test: scripts }, dependencies: { zod: dep } });

const run = (head: string, base = pkg("vitest run", "^4.0.0")) => {
  const { host } = fakeHost({
    changed: ["api/package.json"],
    files: { "api/package.json": head },
    exec: [{ match: "git show", ref: "base", result: { code: 0, output: base } }],
  });
  return manifestDeps.run({ host, n: 1 });
};

describe("manifest-deps", () => {
  it("passes a version bump", async () => {
    expect((await run(pkg("vitest run", "^4.1.0"))).ok).toBe(true);
  });
  it("fails when a script changed with the bump", async () => {
    const r = await run(pkg("true", "^4.1.0"));
    expect(r.ok).toBe(false);
    expect(r.evidence).toContain("api/package.json");
  });
  it("fails closed on a manifest it cannot read", async () => {
    expect((await run("not json")).ok).toBe(false);
  });
});
