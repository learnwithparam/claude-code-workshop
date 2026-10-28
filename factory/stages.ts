import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { ADR_PATH } from "./adr.ts";
import { formatReport } from "./cost-report.ts";
import { nextVersion, prependEntry } from "./release.ts";
import type { Deps, Issue, StageResult } from "./run.ts";
import { writeRunFiles } from "./run-files.ts";
import { parseVitestJson } from "./spec.ts";

const gh = (...args: string[]) => execFileSync("gh", args, { encoding: "utf8" });

// Throwaway HOME and empty git and gh config: the edited code finds no credential to read.
function scrubbedEnv() {
  const home = mkdtempSync(join(tmpdir(), "gate-"));
  return {
    ...Object.fromEntries(
      ["PATH", "SHELL", "TERM", "LANG"].flatMap((k) =>
        process.env[k] ? [[k, process.env[k]]] : [],
      ),
    ),
    HOME: home,
    GIT_CONFIG_GLOBAL: "/dev/null",
    GH_CONFIG_DIR: home,
  };
}

// Run fn with the scrubbed environment, then delete the throwaway home it was given.
function withScrubbedEnv<T>(fn: (env: ReturnType<typeof scrubbedEnv>) => T): T {
  const env = scrubbedEnv();
  try {
    return fn(env);
  } finally {
    rmSync(env.HOME, { recursive: true, force: true });
  }
}

let base = "";
// Matched at any depth: a nested package manifest or config rewrites the gate as well.
const GATE_FILES =
  /(^|\/)(G?[Mm]akefile|package(-lock)?\.json|tsconfig[^/]*\.json|biome\.jsonc?|vitest\.config\.[cm]?[jt]s|\.github\/|\.claude\/hooks\/|\.claude\/settings[^/]*\.json|levels\.json|scripts\/|factory\/|\.factory\/)/;

export const githubDeps: Pick<
  Deps,
  | "getIssue"
  | "comment"
  | "label"
  | "unlabel"
  | "latestPlan"
  | "startBranch"
  | "openPr"
  | "gate"
  | "listAdrs"
  | "applyRelease"
  | "writeAdr"
  | "testResults"
  | "saveRun"
> = {
  async saveRun(n, ledger, lines) {
    const dir = writeRunFiles(process.cwd(), n, ledger, lines);
    console.error(`${formatReport(ledger)}\nwritten to ${dir}`);
  },
  async getIssue(n): Promise<Issue> {
    const raw = JSON.parse(gh("issue", "view", String(n), "--json", "number,title,body,labels"));
    return { ...raw, labels: raw.labels.map((l: { name: string }) => l.name) };
  },
  async comment(n, body) {
    gh("issue", "comment", String(n), "--body", body);
  },
  async label(n, label) {
    gh("label", "create", label, "--force");
    gh("issue", "edit", String(n), "--add-label", label);
  },
  // The build happens on its own branch; a person merges the draft PR, never the factory.
  async startBranch(n) {
    base = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    execFileSync("git", ["switch", "-c", `factory/issue-${n}`], { stdio: "ignore" });
  },
  // The runner, not the model, runs the gate: a stage in plan mode cannot, and must not be believed.
  async gate() {
    // The build may not rewrite the gate it is judged by, and the gate never sees our tokens.
    const lines = (...args: string[]) =>
      execFileSync(
        "git",
        ["-c", "core.fsmonitor=false", "-c", "core.hooksPath=/dev/null", ...args],
        {
          encoding: "utf8",
        },
      )
        .split("\n")
        .filter(Boolean);
    const strays = lines("ls-files", "--others", "--exclude-standard");
    if (strays.length) return { ok: false, output: `untracked files: ${strays.join(", ")}` };
    // Known gap, by design for the workshop: gitignored files are not inspected and the gate runs
    // in the working tree. A clean worktree plus npm ci is the next step; a human reviews the PR.
    const touched = lines("diff", "--name-only", "--no-renames", base).filter((f) =>
      GATE_FILES.test(f),
    );
    if (touched.length)
      return { ok: false, output: `build changed gate files: ${touched.join(", ")}` };
    try {
      withScrubbedEnv((env) =>
        execFileSync("make", ["check"], { encoding: "utf8", stdio: "pipe", env }),
      );
      return { ok: true, output: "make check passed" };
    } catch (error) {
      return {
        ok: false,
        output: String((error as { stdout?: string }).stdout ?? error).slice(-1500),
      };
    }
  },
  // Same scrubbed environment as the gate; vitest's json reporter names every test that ran.
  async testResults() {
    const out = withScrubbedEnv((env) =>
      execFileSync("npx", ["vitest", "run", "--reporter=json"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        env,
        maxBuffer: 64 * 1024 * 1024,
      }),
    );
    return parseVitestJson(out);
  },
  async listAdrs() {
    try {
      return readdirSync("docs/adr").map((f) => `docs/adr/${f}`);
    } catch {
      return [];
    }
  },
  async writeAdr(file, content) {
    if (!ADR_PATH.test(file)) throw new Error(`refusing to write ${file}`);
    mkdirSync("docs/adr", { recursive: true });
    writeFileSync(file, content, { flag: "wx" });
  },
  // The build may not touch package.json, so the runner bumps it itself, after the gate.
  async applyRelease(entry) {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    pkg.version = nextVersion(String(pkg.version));
    writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
    const old = existsSync("CHANGELOG.md") ? readFileSync("CHANGELOG.md", "utf8") : "";
    writeFileSync("CHANGELOG.md", prependEntry(old, entry(pkg.version)));
    return String(pkg.version);
  },
  async openPr(n, title, body) {
    // The agent must not have committed or staged anything itself: the diff is what a human reviews.
    const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const branch = execFileSync("git", ["symbolic-ref", "--short", "HEAD"], {
      encoding: "utf8",
    }).trim();
    if (head !== base || branch !== `factory/issue-${n}`)
      throw new Error("branch or HEAD moved during the build; a human must review");
    execFileSync("git", ["reset", "-q"]);
    // Tracked files only: a new file the agent made (a stray key, a dump) needs a human to add it.
    const stray = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      encoding: "utf8",
    }).trim();
    // The one new file allowed is the ADR the adr stage had the runner write, by exact path shape.
    const others = stray.split("\n").filter((f) => f && f !== "CHANGELOG.md" && !ADR_PATH.test(f));
    if (others.length)
      throw new Error(`untracked files, a human must review them:\n${others.join("\n")}`);
    execFileSync("git", ["add", "-u"]);
    for (const f of stray.split("\n").filter((f) => f === "CHANGELOG.md" || ADR_PATH.test(f)))
      execFileSync("git", ["add", f]);
    execFileSync("git", ["commit", "-m", `${title} (#${n})`], { stdio: "ignore" });
    execFileSync("git", ["push", "-u", "origin", `HEAD:refs/heads/factory/issue-${n}`], {
      stdio: "ignore",
    });
    return gh("pr", "create", "--draft", "--title", title, "--body", body).trim();
  },
  async unlabel(n, label) {
    const raw = JSON.parse(gh("issue", "view", String(n), "--json", "labels"));
    if (raw.labels.some((l: { name: string }) => l.name === label))
      gh("issue", "edit", String(n), "--remove-label", label);
  },
  // The approved plan is the newest comment by the factory's own identity; anyone else's is ignored.
  async latestPlan(n) {
    const me = gh("api", "user", "--jq", ".login").trim();
    const raw = JSON.parse(gh("issue", "view", String(n), "--json", "comments"));
    const mine = raw.comments.filter((c: { author: { login: string } }) => c.author.login === me);
    return String(mine.at(-1)?.body ?? "");
  },
};

const AGENT_ENV = ["PATH", "HOME", "SHELL", "TERM", "LANG", "ANTHROPIC_API_KEY"];

// Agent SDK: the right tool for an agent that works on the codebase (files, shell, hooks, skills).
export const runStage: Deps["runStage"] = async (_stage, model, prompt, limits, extra) => {
  let text = "";
  let failed: string | undefined;
  let costUsd = 0;
  let modelsUsed: string[] = [];
  let usage: StageResult["usage"];
  try {
    for await (const message of query({
      prompt,
      options: {
        model,
        maxTurns: limits.maxTurns,
        maxBudgetUsd: limits.maxBudgetUsd,
        permissionMode: limits.permissionMode,
        settingSources: ["project"],
        strictMcpConfig: true,
        // Allowlist, not process.env: the agent reads untrusted issue text, so it never gets GH_TOKEN.
        env: {
          ...Object.fromEntries(
            AGENT_ENV.flatMap((k) => (process.env[k] ? [[k, process.env[k]]] : [])),
          ),
          CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1",
          ...(extra?.allowProtected ? { FACTORY_ALLOW_PROTECTED: "1" } : {}),
          ANTHROPIC_DEFAULT_HAIKU_MODEL: "claude-haiku-5-5",
        },
      },
    })) {
      if (message.type === "result") {
        text = "result" in message ? String(message.result) : "";
        costUsd = message.total_cost_usd;
        modelsUsed = Object.keys(message.modelUsage ?? {});
        usage = Object.fromEntries(
          Object.entries(message.modelUsage ?? {}).map(([model, u]) => [
            model,
            {
              inputTokens: u.inputTokens,
              outputTokens: u.outputTokens,
              cacheReadInputTokens: u.cacheReadInputTokens,
              cacheCreationInputTokens: u.cacheCreationInputTokens,
              costUsd: u.costUSD,
            },
          ]),
        );
      }
    }
  } catch (error) {
    // A stage that runs out of turns or budget is a failed stage, not a crashed factory.
    failed = error instanceof Error ? error.message : String(error);
  }
  return { text, costUsd, modelsUsed, usage, failed };
};
