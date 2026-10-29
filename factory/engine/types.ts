// The one seam between the engine and the world. Every side effect is a Host method, so a test
// swaps in fake-host.ts and a real run swaps in the git, shell and Agent SDK versions.
export type AgentResult = { text: string; costUsd: number; failed?: string };
export type ExecResult = { code: number; output: string };
export type Host = {
  // Runs .claude/agents/<name>.md: its frontmatter sets the tools, permission mode and isolation.
  agent(name: string, prompt: string, o: { stage: string }): Promise<AgentResult>;
  // `ref: "base"` runs the command against the base commit, which is how `red` proves a test fails first.
  exec(cmd: string, args: string[], o?: { ref?: "base" | "head" }): Promise<ExecResult>;
  read(path: string): Promise<string | null>;
  write(path: string, text: string): Promise<void>;
  list(dir: string): Promise<string[]>;
  changedFiles(): Promise<string[]>;
  // Sets FACTORY_PHASE for the agent's hooks. "fix" turns on the test lock.
  setPhase(phase: string | null): void;
  // A human gate: true once a person has approved this stage for this ticket.
  approved(n: number, stage: string): Promise<boolean>;
};

export type CheckResult = { ok: boolean; evidence: string };
export type TestSize = "small" | "medium" | "large";
export type Ctx = { host: Host; n: number };
export type Check = { size: TestSize; run(ctx: Ctx): Promise<CheckResult> };
