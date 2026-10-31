import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runIssue } from "./cli.ts";
import { ghPreflight } from "./gh-preflight.ts";

const PATH = process.env.PATH;
afterEach(() => {
  process.env.PATH = PATH;
});

const fakeAuth = { mode: "api-key" as const, credential: { name: "ANTHROPIC_API_KEY", value: "x" } };

describe("gh preflight", () => {
  it("passes when gh answers", () => {
    expect(() => ghPreflight(() => "ok")).not.toThrow();
  });

  it("fails with a plain message when gh is logged out", () => {
    expect(() =>
      ghPreflight(() => {
        throw new Error("exit 1");
      }),
    ).toThrow(/gh auth login/);
  });

  it("stops runIssue before any other work when gh has no login", async () => {
    const dir = mkdtempSync(join(tmpdir(), "fake-gh-"));
    writeFileSync(join(dir, "gh"), "#!/bin/sh\nexit 1\n");
    chmodSync(join(dir, "gh"), 0o755);
    process.env.PATH = `${dir}:${PATH}`;
    await expect(runIssue(1, "no-such-workflow", fakeAuth)).rejects.toThrow(/gh auth login/);
  });
});
