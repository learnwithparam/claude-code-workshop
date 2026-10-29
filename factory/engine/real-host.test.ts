import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { approvalIn, parseAgent, realHost } from "./real-host.ts";

const git = (cwd: string, ...a: string[]) => execFileSync("git", a, { cwd, encoding: "utf8" });

function repo() {
  const cwd = mkdtempSync(join(tmpdir(), "rh-"));
  git(cwd, "init", "-q", "-b", "main");
  git(cwd, "config", "user.email", "t@t");
  git(cwd, "config", "user.name", "t");
  writeFileSync(join(cwd, "a.txt"), "1");
  git(cwd, "add", "-A");
  git(cwd, "commit", "-qm", "base");
  const base = git(cwd, "rev-parse", "HEAD").trim();
  return {
    cwd,
    base,
    host: realHost({ cwd, base, stateDir: join(cwd, "..", `st-${Date.now()}`) }),
  };
}

describe("parseAgent", () => {
  it("splits frontmatter from the prompt body", () => {
    const a = parseAgent("---\nmodel: haiku\ntools: Read, Grep\n---\nBe brief.\n");
    expect(a.fm).toEqual({ model: "haiku", tools: "Read, Grep" });
    expect(a.body).toBe("Be brief.");
  });
});

describe("approvalIn", () => {
  const line = "approve spec abc";
  it("counts a collaborator's exact line", () => {
    expect(approvalIn([{ body: `ok\n${line}`, authorAssociation: "OWNER" }], "spec", "abc")).toBe(
      true,
    );
  });
  it("refuses a stranger, a bot-free outsider, another digest or another stage", () => {
    const c = (authorAssociation: string, body = line) => [{ body, authorAssociation }];
    expect(approvalIn(c("NONE"), "spec", "abc")).toBe(false);
    expect(approvalIn(c("OWNER"), "spec", "other")).toBe(false);
    expect(approvalIn(c("OWNER"), "plan", "abc")).toBe(false);
    expect(approvalIn(c("OWNER", `please ${line} later`), "spec", "abc")).toBe(false);
  });
});

describe("realHost over a git repo", () => {
  it("reports changed and new files, lists them, and round-trips files", async () => {
    const { host, cwd } = repo();
    await host.write("specs/1/spec.md", "s");
    writeFileSync(join(cwd, "a.txt"), "2");
    expect((await host.changedFiles()).sort()).toEqual(["a.txt", "specs/1/spec.md"]);
    expect(await host.list("specs/")).toEqual(["specs/1/spec.md"]);
    expect(await host.read("specs/1/spec.md")).toBe("s");
    expect(await host.read("nope")).toBeNull();
  });
  it("keeps recalled state outside the worktree", async () => {
    const { host } = repo();
    await host.remember("lock:1", "h");
    expect(await host.recall("lock:1")).toBe("h");
    expect(await host.recall("lock:2")).toBeNull();
  });
  it("runs a command against the base commit with this run's specs laid over it", async () => {
    const { host, cwd } = repo();
    mkdirSync(join(cwd, "specs/1"), { recursive: true });
    writeFileSync(join(cwd, "specs/1/t.txt"), "spec");
    writeFileSync(join(cwd, "a.txt"), "head");
    const r = await host.exec("sh", ["-c", "cat a.txt specs/1/t.txt"], { ref: "base" });
    expect(r.output).toBe("1spec");
    expect((await host.exec("sh", ["-c", "cat a.txt"])).output).toBe("head");
  });
});

describe("realHost isolation", () => {
  it("runs checks without the API key or a GitHub token", async () => {
    const { host } = repo();
    process.env.ANTHROPIC_API_KEY = "k";
    process.env.GH_TOKEN = "g";
    const r = await host.exec("sh", ["-c", 'echo "[$ANTHROPIC_API_KEY][$GH_TOKEN]"']);
    expect(r.output.trim()).toBe("[][]");
  });
});

describe("realHost home", () => {
  it("gives checks a throwaway HOME, not the person's", async () => {
    const { host } = repo();
    const r = await host.exec("sh", ["-c", 'echo "$HOME"']);
    expect(r.output.trim()).not.toBe(process.env.HOME);
    expect(r.output).toContain("factory-home-");
  });
});
