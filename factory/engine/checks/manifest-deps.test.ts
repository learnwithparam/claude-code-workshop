import { describe, expect, it } from "vitest";
import { fakeHost } from "../fake-host.ts";
import { manifestDeps } from "./manifest-deps.ts";

const pkg = (script: string, deps: Record<string, string>) =>
  JSON.stringify({ scripts: { test: script }, dependencies: deps });
const lock = (...resolved: string[]) =>
  JSON.stringify({
    packages: Object.fromEntries(resolved.map((r, i) => [`node_modules/p${i}`, { resolved: r }])),
  });

const BASE = pkg("vitest run", { zod: "^4.0.0" });
const OLD_LOCK = lock("https://registry.npmjs.org/zod/-/zod-4.0.0.tgz");

// Runs the check over the files an agent changed, each compared with its base copy.
const run = (head: Record<string, string>, base: Record<string, string>) => {
  const { host } = fakeHost({
    changed: Object.keys(head),
    files: head,
    exec: Object.entries(base).map(([file, output]) => ({
      match: `git show HEAD:${file}`,
      ref: "base" as const,
      result: { code: 0, output },
    })),
  });
  return manifestDeps.run({ host, n: 1 });
};
const manifest = (head: string) => run({ "api/package.json": head }, { "api/package.json": BASE });
const lockfile = (head: string) =>
  run({ "package-lock.json": head }, { "package-lock.json": OLD_LOCK });

describe("manifest-deps on a manifest", () => {
  it("passes a version bump", async () => {
    expect((await manifest(pkg("vitest run", { zod: "^4.1.0" }))).ok).toBe(true);
  });
  it("fails when a script changed with the bump", async () => {
    const r = await manifest(pkg("true", { zod: "^4.1.0" }));
    expect(r.ok).toBe(false);
    expect(r.evidence).toContain("more than dependency versions");
  });
  it.each(["file:../evil", "git+https://x/y.git", "https://x/y.tgz", "npm:evil@1.0.0", "latest"])(
    "fails a dependency that points at %s",
    async (spec) => {
      expect((await manifest(pkg("vitest run", { zod: spec }))).ok).toBe(false);
    },
  );
  it("fails when a package is added", async () => {
    const r = await manifest(pkg("vitest run", { zod: "^4.0.0", evil: "^1.0.0" }));
    expect(r.evidence).toContain("adds or removes a package");
  });
  it("fails closed on a manifest it cannot read", async () => {
    expect((await manifest("not json")).ok).toBe(false);
  });
});

describe("manifest-deps on a lockfile", () => {
  it("passes a new resolution from the registry", async () => {
    expect((await lockfile(lock("https://registry.npmjs.org/zod/-/zod-4.1.0.tgz"))).ok).toBe(true);
  });
  it("fails a resolution from anywhere else", async () => {
    const r = await lockfile(lock("https://evil.example/zod.tgz"));
    expect(r.ok).toBe(false);
    expect(r.evidence).toContain("does not come from the npm registry");
  });
});
