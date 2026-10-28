import { execFileSync } from "node:child_process";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Deps, Issue } from "./run.ts";

const gh = (...args: string[]) => execFileSync("gh", args, { encoding: "utf8" });

let base = "";

export const githubDeps: Pick<
  Deps,
  "getIssue" | "comment" | "label" | "unlabel" | "latestPlan" | "startBranch" | "openPr" | "gate"
> = {
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
    try {
      execFileSync("make", ["check"], { encoding: "utf8", stdio: "pipe" });
      return { ok: true, output: "make check passed" };
    } catch (error) {
      return {
        ok: false,
        output: String((error as { stdout?: string }).stdout ?? error).slice(-1500),
      };
    }
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
    if (stray) throw new Error(`untracked files, a human must review them:\n${stray}`);
    execFileSync("git", ["add", "-u"]);
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
export const runStage: Deps["runStage"] = async (_stage, model, prompt, limits) => {
  let text = "";
  let failed: string | undefined;
  let costUsd = 0;
  let modelsUsed: string[] = [];
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
          ANTHROPIC_DEFAULT_HAIKU_MODEL: "claude-haiku-5-5",
        },
      },
    })) {
      if (message.type === "result") {
        text = "result" in message ? String(message.result) : "";
        costUsd = message.total_cost_usd;
        modelsUsed = Object.keys(message.modelUsage ?? {});
      }
    }
  } catch (error) {
    // A stage that runs out of turns or budget is a failed stage, not a crashed factory.
    failed = error instanceof Error ? error.message : String(error);
  }
  return { text, costUsd, modelsUsed, failed };
};
