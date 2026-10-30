import type { AgentResult, ExecResult, Host } from "./types.ts";

export type FakeScript = {
  // One entry is consumed per agent call; the last repeats.
  agents?: Partial<AgentResult>[];
  // Answers by agent name instead of by call order; wins over `agents` when it returns a value.
  byAgent?: (name: string) => Partial<AgentResult> | undefined;
  // exec results by "cmd args" prefix and ref; first match wins.
  exec?: { match: string; ref?: "base" | "head"; result: ExecResult }[];
  files?: Record<string, string>;
  changed?: string[];
  approvals?: string[];
};

export function fakeHost(script: FakeScript = {}) {
  const files = new Map(Object.entries(script.files ?? {}));
  const state = new Map<string, string>();
  const calls: string[] = [];
  const prompts: string[] = [];
  const phases: (string | null)[] = [];
  let agentCalls = 0;
  const host: Host = {
    async agent(name, prompt, o) {
      prompts.push(prompt);
      calls.push(`agent ${name} ${o.stage}`);
      const named = script.byAgent?.(name);
      if (named) return { text: "", costUsd: 0.01, ...named };
      const list = script.agents ?? [{}];
      const next = list[Math.min(agentCalls++, list.length - 1)] ?? {};
      return { text: "", costUsd: 0.01, ...next };
    },
    async exec(cmd, args, o) {
      const line = [cmd, ...args].join(" ");
      calls.push(`exec ${line}${o?.ref === "base" ? " @base" : ""}`);
      const hit = script.exec?.find(
        (e) => line.startsWith(e.match) && (!e.ref || e.ref === (o?.ref ?? "head")),
      );
      return hit?.result ?? { code: 0, output: "ok" };
    },
    read: async (p) => files.get(p) ?? null,
    write: async (p, t) => void files.set(p, t),
    list: async (d) => [...files.keys()].filter((k) => k.startsWith(d)),
    changedFiles: async () => script.changed ?? [...files.keys()],
    commit: async (m) => void calls.push(`commit ${m}`),
    recall: async (k) => state.get(k) ?? null,
    remember: async (k, v) => void state.set(k, v),
    setPhase: (p) => void phases.push(p),
    approved: async (n, stage, digest) =>
      script.approvals?.some((a) => a === `${n}:${stage}` || a === `${n}:${stage}:${digest}`) ??
      false,
  };
  return { host, files, calls, phases, prompts };
}
