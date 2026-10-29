import { describe, expect, it } from "vitest";
import { fakeHost } from "../fake-host.ts";
import { manifestDeps } from "./manifest-deps.ts";

const pkg = (script: string, deps: Record<string, string>) =>
  JSON.stringify({ scripts: { test: script }, dependencies: deps });
const tarball = (name: string, version: string) =>
  `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`;
const lock = (version: string, resolved = tarball("zod", version), lockfileVersion = 3) =>
  JSON.stringify({ lockfileVersion, packages: { "node_modules/zod": { version, resolved } } });

const BASE = pkg("vitest run", { zod: "^4.0.0" });
const OLD_LOCK = lock("4.0.0");

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
  it("passes the registry tarball for the new version", async () => {
    expect((await lockfile(lock("4.1.0"))).ok).toBe(true);
  });
  it("fails a resolution from anywhere else", async () => {
    const r = await lockfile(lock("4.1.0", "https://evil.example/zod.tgz"));
    expect(r.ok).toBe(false);
    expect(r.evidence).toContain("not the registry tarball");
  });
  it("fails the registry host with another package's tarball", async () => {
    expect((await lockfile(lock("4.1.0", tarball("evil", "9.9.9")))).ok).toBe(false);
  });
  it("fails a lockfile version it does not understand", async () => {
    expect((await lockfile(lock("4.1.0", undefined, 1))).ok).toBe(false);
  });
});

describe("manifest-deps on other install files", () => {
  it.each(["yarn.lock", ".npmrc", "npm-shrinkwrap.json", "pnpm-lock.yaml"])(
    "fails a change to %s",
    async (file) => {
      const { host } = fakeHost({ changed: [file], files: { [file]: "x" } });
      expect((await manifestDeps.run({ host, n: 1 })).ok).toBe(false);
    },
  );
});
