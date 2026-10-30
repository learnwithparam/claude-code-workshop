import { execFileSync, spawnSync } from "node:child_process";
import { createHash, createHmac, randomBytes } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Host } from "./types.ts";

const AGENT_ENV = ["PATH", "SHELL", "TERM", "LANG", "ANTHROPIC_API_KEY"];
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

type Comment = { body: string; authorAssociation: string; author?: { login: string } };
// Only a person with write access counts. The agents hold no GitHub token, so they cannot approve.
export function approvalIn(
  comments: Comment[],
  stage: string,
  digest: string,
  approvers?: string[],
  need = 1,
): boolean {
  const line = `approve ${stage} ${digest}`;
  // Distinct people: one person commenting twice is still one approval.
  const who = new Set(
    comments
      .filter(
        (c) =>
          ["OWNER", "MEMBER", "COLLABORATOR"].includes(c.authorAssociation) &&
          (!approvers || approvers.includes(c.author?.login ?? "")) &&
          c.body.split("\n").some((l) => l.trim() === line),
      )
      .map((c) => c.author?.login ?? ""),
  );
  return who.size >= need;
}

export type RealHostOptions = {
  // GitHub logins whose comments count as approval. The agents cannot comment as them.
  approvers?: string[];
  cwd: string;
  base: string;
  stateDir?: string;
  maxUsdPerAgent?: number;
};

export function realHost(o: RealHostOptions): Host {
  // One folder per process: a file left by an earlier run was signed with another key and must never be read.
  const state =
    o.stateDir ??
    join(homedir(), ".factory", "state", `${process.pid}-${randomBytes(4).toString("hex")}`);
  if (!o.stateDir) process.once("exit", () => rmSync(state, { recursive: true, force: true }));
  // Checks run code the agent wrote: no API key, no GitHub token, a throwaway HOME and no global git config.
  const home = mkdtempSync(join(tmpdir(), "factory-home-"));
  process.once("exit", () => rmSync(home, { recursive: true, force: true }));
  const SAFE_ENV = {
    GIT_CONFIG_NOSYSTEM: "1",
    ...Object.fromEntries(
      ["PATH", "SHELL", "TERM", "LANG"].flatMap((k) =>
        process.env[k] ? [[k, process.env[k]]] : [],
      ),
    ),
    HOME: home,
    GIT_CONFIG_GLOBAL: "/dev/null",
    // The throwaway HOME hides the browser the e2e checks launch, so point at the real, read-only cache.
    PLAYWRIGHT_BROWSERS_PATH:
      process.env.PLAYWRIGHT_BROWSERS_PATH ??
      join(
        homedir(),
        process.platform === "darwin" ? "Library/Caches/ms-playwright" : ".cache/ms-playwright",
      ),
  };
  const sh = (cmd: string, args: string[], cwd = o.cwd, env: NodeJS.ProcessEnv = SAFE_ENV) =>
    spawnSync(cmd, args, { cwd, encoding: "utf8", maxBuffer: 64 << 20, env });
  const git = (...a: string[]) => execFileSync("git", a, { cwd: o.cwd, encoding: "utf8" });
  const tracked = () => git("ls-files", "-co", "--exclude-standard").split("\n").filter(Boolean);
  // Repo config can name programs git runs (filters, gpg, fsmonitor). Pin it now; commit refuses if an agent changed it.
  const gitConfig = () => {
    // The effective config of every scope git reads (system, global, repo, worktree, includes), not one file.
    // Read it with the same environment the commit runs in, so the pin is what the commit will see.
    const r = sh("git", ["config", "--list", "--includes", "--show-origin"]);
    const out = r.stdout ?? "";
    if (r.status !== 0 || !out.trim()) throw new Error("cannot read the repo git config");
    // Config can name programs that git runs while staging or committing; none is allowed.
    const n = sh("git", ["config", "--list", "--includes", "--name-only", "-z"]);
    if (n.status !== 0) throw new Error("cannot read the repo git config");
    const names = n.stdout ?? "";
    if (
      names.split("\0").some((k) => /^(filter\..+|diff\..+\.textconv|merge\..+\.driver)$/i.test(k))
    )
      throw new Error("git config names a filter, textconv or merge driver; refusing to commit");
    return createHash("sha256").update(out).digest("hex");
  };
  const pinnedConfig = gitConfig();
  let phase: string | null = null;
  // The key lives only in this process, so an agent that rewrites a state file cannot forge its tag.
  const key = randomBytes(32);
  const tag = (v: string) => createHmac("sha256", key).update(v).digest("hex");

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
            permissionMode: fm.permissionMode === "acceptEdits" ? "acceptEdits" : "plan",
            allowedTools: fm.tools?.split(",").map((t) => t.trim()),
            systemPrompt: { type: "preset", preset: "claude_code", append: body },
            settingSources: ["project"],
            strictMcpConfig: true,
            env: {
              ...Object.fromEntries(
                AGENT_ENV.flatMap((k) => (process.env[k] ? [[k, process.env[k]]] : [])),
              ),
              HOME: home,
              GIT_CONFIG_GLOBAL: "/dev/null",
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
      // NUL-separated so odd file names cannot hide; a rename lists both its new and old path.
      const parts = git("status", "--porcelain=v1", "-z", "-uall").split("\0");
      const dirty: string[] = [];
      for (let i = 0; i < parts.length; i++) {
        const e = parts[i] ?? "";
        if (e.length < 4) continue;
        dirty.push(e.slice(3));
        if ("RC".includes(e[0] ?? "") || "RC".includes(e[1] ?? "")) dirty.push(parts[++i] ?? "");
      }
      return [...new Set([...diff, ...dirty])].filter(Boolean);
    },

    async commit(message) {
      // No repo hooks or fsmonitor: the agent can write .git/hooks, and a commit must not run them.
      if (gitConfig() !== pinnedConfig)
        throw new Error("git config changed during the run; refusing to commit");
      const g = (...a: string[]) =>
        sh("git", [
          "-c",
          "core.hooksPath=/dev/null",
          "-c",
          "core.fsmonitor=false",
          "-c",
          "commit.gpgsign=false",
          "-c",
          "core.attributesFile=/dev/null",
          ...a,
        ]);
      g("add", "-A");
      const r = g(
        "-c",
        "user.name=factory",
        "-c",
        "user.email=factory@localhost",
        "commit",
        "--no-verify",
        "-m",
        message,
      );
      if (r.status !== 0) throw new Error(`commit failed: ${r.stderr}`);
    },

    async recall(k) {
      const f = join(state, k.replaceAll(/[^\w.-]/g, "_"));
      if (!existsSync(f)) return null;
      const [t, ...rest] = readFileSync(f, "utf8").split("\n");
      const v = rest.join("\n");
      // A bad tag must stop the run: reading it as "no baseline" would let the lock re-record edited tests.
      if (t !== tag(v)) throw new Error(`runner state "${k}" was changed outside the runner`);
      return v;
    },
    async remember(k, value) {
      mkdirSync(state, { recursive: true });
      writeFileSync(join(state, k.replaceAll(/[^\w.-]/g, "_")), `${tag(value)}\n${value}`);
    },
    setPhase(p) {
      phase = p;
    },
    async approved(n, stage, digest, need = 1) {
      // Runner-side call with the real environment: gh needs the person's login, the agents never see it.
      const r = sh("gh", ["issue", "view", String(n), "--json", "comments"], o.cwd, process.env);
      if (r.status !== 0) return false;
      return approvalIn(JSON.parse(r.stdout).comments ?? [], stage, digest, o.approvers, need);
    },
  };
}
