import { execFileSync } from "node:child_process";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Deps, Issue } from "./run.ts";

const gh = (...args: string[]) => execFileSync("gh", args, { encoding: "utf8" });

export const githubDeps: Pick<Deps, "getIssue" | "comment" | "label" | "unlabel"> = {
  async getIssue(n): Promise<Issue> {
    const raw = JSON.parse(gh("issue", "view", String(n), "--json", "number,title,body,labels"));
    return { ...raw, labels: raw.labels.map((l: { name: string }) => l.name) };
  },
  async comment(n, body) {
    gh("issue", "comment", String(n), "--body", body);
  },
  async label(n, label) {
    gh("issue", "edit", String(n), "--add-label", label);
  },
  async unlabel(n, label) {
    gh("issue", "edit", String(n), "--remove-label", label);
  },
};

const AGENT_ENV = ["PATH", "HOME", "SHELL", "TERM", "LANG", "ANTHROPIC_API_KEY"];

// Agent SDK: the right tool for an agent that works on the codebase (files, shell, hooks, skills).
export const runStage: Deps["runStage"] = async (_stage, model, prompt, limits) => {
  let text = "";
  let costUsd = 0;
  let modelsUsed: string[] = [];
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
  return { text, costUsd, modelsUsed };
};
