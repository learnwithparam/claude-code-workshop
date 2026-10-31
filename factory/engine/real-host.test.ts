import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Options, query } from "@anthropic-ai/claude-agent-sdk";
import { describe, expect, it } from "vitest";
import { type Auth, TOKEN_ENV } from "./auth.ts";
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
    git(cwd, "config", "core.autocrlf", "true");
    writeFileSync(join(cwd, "n.txt"), "x");
    await expect(host.commit("#1")).rejects.toThrow(/git config changed/);
  });
  it("refuses to commit when the config names a filter program", async () => {
    const { host, cwd } = repo();
    git(cwd, "config", "filter.x.clean", "touch ../filter-ran");
    writeFileSync(join(cwd, "n.txt"), "x");
    await expect(host.commit("#1")).rejects.toThrow(/filter, textconv or merge driver/);
    expect(existsSync(join(cwd, "..", "filter-ran"))).toBe(false);
  });
  it("finds a filter key even when its config file path has spaces", async () => {
    const { host, cwd } = repo();
    mkdirSync(join(cwd, "a b"));
    writeFileSync(join(cwd, "a b", "x.cfg"), '[filter "x"]\n\tclean = touch ../filter-ran\n');
    git(cwd, "config", "include.path", join(cwd, "a b", "x.cfg"));
    writeFileSync(join(cwd, "n.txt"), "x");
    await expect(host.commit("#1")).rejects.toThrow(/filter, textconv or merge driver/);
  });
  it("sees a config change made through an included file", async () => {
    const { host, cwd } = repo();
    writeFileSync(join(cwd, "extra.cfg"), "[core]\n\tfsmonitor = true\n");
    git(cwd, "config", "include.path", join(cwd, "extra.cfg"));
    writeFileSync(join(cwd, "n.txt"), "x");
    await expect(host.commit("#1")).rejects.toThrow(/git config changed/);
  });
  it("does not read state left by an earlier process", async () => {
    // No stateDir: the default folder is per process, so a stale, differently signed file is never opened.
    const { cwd } = repo();
    const base = git(cwd, "rev-parse", "HEAD").trim();
    const a = realHost({ cwd, base });
    await a.remember("lock:1", "abc");
    const b = realHost({ cwd, base });
    expect(await b.recall("lock:1")).toBeNull();
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
  it("runs checks without the API key, the subscription token or a GitHub token", async () => {
    const { host } = repo();
    process.env.ANTHROPIC_API_KEY = "k";
    process.env.CLAUDE_CODE_OAUTH_TOKEN = "t";
    process.env.GH_TOKEN = "g";
    const r = await host.exec("sh", [
      "-c",
      'echo "[$ANTHROPIC_API_KEY][$CLAUDE_CODE_OAUTH_TOKEN][$GH_TOKEN]"',
    ]);
    expect(r.output.trim()).toBe("[][][]");
  });
});

// A stand-in for the SDK's query(): records the options and answers with one result message.
function fakeQuery(seen: Options[], tokens = 10) {
  return (({ options }: { options: Options }) => {
    seen.push(options);
    return (async function* () {
      yield {
        type: "result",
        result: "ok",
        total_cost_usd: 0.25,
        modelUsage: {
          m: {
            inputTokens: tokens,
            outputTokens: 0,
            cacheReadInputTokens: 0,
            cacheCreationInputTokens: 0,
          },
        },
      };
    })();
  }) as unknown as typeof query;
}

describe("realHost auth", () => {
  const agents = (cwd: string) => {
    mkdirSync(join(cwd, ".claude/agents"), { recursive: true });
    writeFileSync(join(cwd, ".claude/agents/a.md"), "---\nmodel: haiku\n---\nBe brief.\n");
  };
  const host = (auth: Auth, seen: Options[], tokens?: number) => {
    const { cwd, base } = repo();
    agents(cwd);
    return realHost({
      cwd,
      base,
      stateDir: join(cwd, "..", `sa-${Date.now()}`),
      auth,
      subscriptionCap: { calls: 2, tokens: 1000 },
      query: fakeQuery(seen, tokens),
    });
  };
  const sub: Auth = { mode: "subscription", credential: { name: TOKEN_ENV, value: "tok" } };
  const key: Auth = { mode: "api-key", credential: { name: "ANTHROPIC_API_KEY", value: "key" } };

  it("hands the agent only the subscription token, and no dollar budget", async () => {
    process.env.ANTHROPIC_API_KEY = "k";
    const seen: Options[] = [];
    const h = host(sub, seen);
    const r = await h.agent("a", "p", { stage: "build" });
    expect(seen[0]?.env?.[TOKEN_ENV]).toBe("tok");
    expect(seen[0]?.env?.ANTHROPIC_API_KEY).toBeUndefined();
    expect(seen[0]?.maxBudgetUsd).toBeUndefined();
    // No bill: the dollar figure stays out of the run total, the estimate is kept for the report.
    expect(r.costUsd).toBe(0);
    expect(h.usage()).toMatchObject({
      auth: "subscription",
      calls: 1,
      tokens: 10,
      estimatedUsd: 0.25,
    });
  });
  it("hands the agent only the key in api-key mode, with a dollar budget", async () => {
    process.env.CLAUDE_CODE_OAUTH_TOKEN = "t";
    const seen: Options[] = [];
    const r = await host(key, seen).agent("a", "p", { stage: "build" });
    expect(seen[0]?.env?.ANTHROPIC_API_KEY).toBe("key");
    expect(seen[0]?.env?.[TOKEN_ENV]).toBeUndefined();
    expect(seen[0]?.maxBudgetUsd).toBe(3);
    expect(r.costUsd).toBe(0.25);
  });
  it("refuses a subscription call past the run's call cap", async () => {
    const seen: Options[] = [];
    const h = host(sub, seen);
    await h.agent("a", "p", { stage: "build" });
    await h.agent("a", "p", { stage: "build" });
    const r = await h.agent("a", "p", { stage: "build" });
    expect(r.failed).toMatch(/subscription cap/);
    expect(seen).toHaveLength(2);
  });
});

describe("realHost home", () => {
  it("lets checks find the installed browser despite the throwaway HOME", async () => {
    const { host } = repo();
    const r = await host.exec("sh", ["-c", 'echo "$PLAYWRIGHT_BROWSERS_PATH"']);
    expect(r.output.trim()).toMatch(/ms-playwright$/);
  });
  it("gives checks a throwaway HOME, not the person's", async () => {
    const { host } = repo();
    const r = await host.exec("sh", ["-c", 'echo "$HOME"']);
    expect(r.output.trim()).not.toBe(process.env.HOME);
    expect(r.output).toContain("factory-home-");
  });
});
