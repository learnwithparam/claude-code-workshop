import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Host } from "./types.ts";

const AGENT_ENV = ["PATH", "HOME", "SHELL", "TERM", "LANG", "ANTHROPIC_API_KEY"];
const MODELS: Record<string, string> = {
  opus: "claude-opus-5-5",
  sonnet: "claude-sonnet-5-5",
  haiku: "claude-haiku-5-5",
};

// .claude/agents/<name>.md: the frontmatter sets what the agent may do, the body is its prompt.
export function parseAgent(text: string) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  const fm: Record<string, string> = {};
  for (const line of (m?.[1] ?? "").split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { fm, body: (m?.[2] ?? text).trim() };
}

type Comment = { body: string; authorAssociation: string };
// Only a person with write access counts. The agents hold no GitHub token, so they cannot approve.
export function approvalIn(comments: Comment[], stage: string, digest: string): boolean {
  const line = `approve ${stage} ${digest}`;
  return comments.some(
    (c) =>
      ["OWNER", "MEMBER", "COLLABORATOR"].includes(c.authorAssociation) &&
      c.body.split("\n").some((l) => l.trim() === line),
  );
}

export type RealHostOptions = {
  cwd: string;
  base: string;
  stateDir?: string;
  maxUsdPerAgent?: number;
};

export function realHost(o: RealHostOptions): Host {
  const state = o.stateDir ?? join(homedir(), ".factory", "state");
  const sh = (cmd: string, args: string[], cwd = o.cwd) =>
    spawnSync(cmd, args, { cwd, encoding: "utf8", maxBuffer: 64 << 20 });
  const git = (...a: string[]) => execFileSync("git", a, { cwd: o.cwd, encoding: "utf8" });
  const tracked = () => git("ls-files", "-co", "--exclude-standard").split("\n").filter(Boolean);
  let phase: string | null = null;

  return {
    async agent(name, prompt, { stage }) {
      const { fm, body } = parseAgent(
        readFileSync(join(o.cwd, ".claude/agents", `${name}.md`), "utf8"),
      );
      let text = "";
      let costUsd = 0;
      let failed: string | undefined;
      try {
        for await (const msg of query({
          prompt,
          options: {
            cwd: o.cwd,
            model: MODELS[fm.model ?? "sonnet"] ?? fm.model,
            maxTurns: Number(fm.maxTurns ?? 20),
            maxBudgetUsd: o.maxUsdPerAgent ?? 3,
            permissionMode: (fm.permissionMode as "plan" | "acceptEdits") ?? "plan",
            allowedTools: fm.tools?.split(",").map((t) => t.trim()),
            systemPrompt: { type: "preset", preset: "claude_code", append: body },
            settingSources: ["project"],
            strictMcpConfig: true,
            env: {
              ...Object.fromEntries(
                AGENT_ENV.flatMap((k) => (process.env[k] ? [[k, process.env[k]]] : [])),
              ),
              CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1",
              FACTORY_STAGE: stage,
              ...(phase ? { FACTORY_PHASE: phase } : {}),
            },
          },
        })) {
          if (msg.type === "result") {
            text = "result" in msg ? String(msg.result) : "";
            costUsd = msg.total_cost_usd;
          }
        }
      } catch (e) {
        failed = e instanceof Error ? e.message : String(e);
      }
      return { text, costUsd, failed };
    },

    async exec(cmd, args, opt) {
      if (opt?.ref !== "base") {
        const r = sh(cmd, args);
        return { code: r.status ?? 1, output: `${r.stdout}${r.stderr}` };
      }
      // The base run sits inside the repo so node_modules resolves by walking up; no symlink needed.
      const dir = join(o.cwd, ".factory-base");
      rmSync(dir, { recursive: true, force: true });
      git("worktree", "add", "--detach", "-f", dir, o.base);
      try {
        for (const f of git("ls-files", "-co", "--exclude-standard", "specs")
          .split("\n")
          .filter(Boolean)) {
          mkdirSync(dirname(join(dir, f)), { recursive: true });
          cpSync(join(o.cwd, f), join(dir, f));
        }
        const r = sh(cmd, args, dir);
        return { code: r.status ?? 1, output: `${r.stdout}${r.stderr}` };
      } finally {
        sh("git", ["worktree", "remove", "--force", dir]);
        rmSync(dir, { recursive: true, force: true });
      }
    },

    async read(p) {
      const f = join(o.cwd, p);
      return existsSync(f) ? readFileSync(f, "utf8") : null;
    },
    async write(p, text) {
      mkdirSync(dirname(join(o.cwd, p)), { recursive: true });
      writeFileSync(join(o.cwd, p), text);
    },
    async list(dir) {
      return tracked().filter((f) => f.startsWith(dir) && existsSync(join(o.cwd, f)));
    },
    async changedFiles() {
      const diff = git("diff", "--name-only", `${o.base}...HEAD`).split("\n");
      const dirty = git("status", "--porcelain", "-uall")
        .split("\n")
        .map((l) => l.slice(3));
      return [...new Set([...diff, ...dirty])].filter(Boolean);
    },

    async recall(key) {
      const f = join(state, key.replaceAll(/[^\w.-]/g, "_"));
      return existsSync(f) ? readFileSync(f, "utf8") : null;
    },
    async remember(key, value) {
      mkdirSync(state, { recursive: true });
      writeFileSync(join(state, key.replaceAll(/[^\w.-]/g, "_")), value);
    },
    setPhase(p) {
      phase = p;
    },
    async approved(n, stage, digest) {
      const r = sh("gh", ["issue", "view", String(n), "--json", "comments"]);
      if (r.status !== 0) return false;
      return approvalIn(JSON.parse(r.stdout).comments ?? [], stage, digest);
    },
  };
}
