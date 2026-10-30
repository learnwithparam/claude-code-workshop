// The one seam between the engine and the world. Every side effect is a Host method, so a test
// swaps in fake-host.ts and a real run swaps in the git, shell and Agent SDK versions.
export type AgentResult = { text: string; costUsd: number; failed?: string };
export type ExecResult = { code: number; output: string };
export type Host = {
  // `model` and `maxUsd` come from the resolver and the run cap; without them the frontmatter decides.
  // Runs .claude/agents/<name>.md: its frontmatter sets the tools, permission mode and isolation.
  agent(
    name: string,
    prompt: string,
    o: { stage: string; model?: string; maxUsd?: number },
  ): Promise<AgentResult>;
  // `ref: "base"` runs the command against the base commit, which is how `red` proves a test fails first.
  exec(cmd: string, args: string[], o?: { ref?: "base" | "head" }): Promise<ExecResult>;
  read(path: string): Promise<string | null>;
  write(path: string, text: string): Promise<void>;
  list(dir: string): Promise<string[]>;
  changedFiles(): Promise<string[]>;
  // One commit of everything changed so far; how single-pr-commits leaves a commit per sub-issue.
  commit(message: string): Promise<void>;
  // Runner-owned state that lives outside the worktree, so the agent cannot rewrite it (the lock baseline).
  recall(key: string): Promise<string | null>;
  remember(key: string, value: string): Promise<void>;
  // Sets FACTORY_PHASE for the agent's hooks. "fix" turns on the test lock.
  setPhase(phase: string | null): void;
  // A human gate: true once a person approved this stage's artifacts. `digest` is the hash of what they
  // read, so an approval of one version never covers another.
  approved(n: number, stage: string, digest: string): Promise<boolean>;
};

export type CheckResult = { ok: boolean; evidence: string };
export type TestSize = "small" | "medium" | "large";
export type Ctx = { host: Host; n: number };
export type Check = { size: TestSize; run(ctx: Ctx): Promise<CheckResult> };
