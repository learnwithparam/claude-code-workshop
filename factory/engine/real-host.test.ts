import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
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
  it("with an allowlist, refuses another collaborator", () => {
    const c = [{ body: line, authorAssociation: "COLLABORATOR", author: { login: "bot" } }];
    expect(approvalIn(c, "spec", "abc", ["param"])).toBe(false);
    expect(approvalIn(c, "spec", "abc", ["bot"])).toBe(true);
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
  it("ignores recalled state an agent rewrote", async () => {
    const { host, cwd } = repo();
    await host.remember("lock", "abc");
    expect(await host.recall("lock")).toBe("abc");
    const f = join(cwd, "..", "state-forge");
    mkdirSync(f, { recursive: true });
    writeFileSync(join(f, "lock"), "forged");
    await expect(realHost({ cwd, base: "HEAD", stateDir: f }).recall("lock")).rejects.toThrow(
      /outside the runner/,
    );
  });
  it("lists both sides of a rename and files with odd names", async () => {
    const { host, cwd } = repo();
    git(cwd, "mv", "a.txt", "b c.txt");
    expect((await host.changedFiles()).sort()).toEqual(["a.txt", "b c.txt"]);
  });
  it("lists the original path of a worktree-only rename", async () => {
    const { host, cwd } = repo();
    git(cwd, "mv", "a.txt", "r.txt");
    git(cwd, "reset", "-q");
    git(cwd, "add", "-N", "r.txt");
    expect(await host.changedFiles()).toEqual(expect.arrayContaining(["a.txt", "r.txt"]));
  });
  it("commits without running a hook the agent planted", async () => {
    const { host, cwd } = repo();
    const hook = join(cwd, ".git", "hooks", "pre-commit");
    mkdirSync(join(cwd, ".git", "hooks"), { recursive: true });
    writeFileSync(hook, "#!/bin/sh\ntouch ../hook-ran\nexit 1\n", { mode: 0o755 });
    writeFileSync(join(cwd, "new.txt"), "x");
    await host.commit("#1");
    expect(git(cwd, "log", "-1", "--format=%s").trim()).toBe("#1");
    expect(existsSync(join(cwd, "..", "hook-ran"))).toBe(false);
  });
  it("refuses to commit after an agent changed the repo git config", async () => {
    const { host, cwd } = repo();
    git(cwd, "config", "filter.x.clean", "touch ../filter-ran");
    writeFileSync(join(cwd, "n.txt"), "x");
    await expect(host.commit("#1")).rejects.toThrow(/git config changed/);
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
