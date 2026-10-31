import type { Check, CheckResult, Ctx, TestSize } from "../types.ts";

const tail = (s: string) => s.trim().split("\n").slice(-12).join("\n");

// A check that is only a command: it passes on exit 0 and the evidence is the end of its output.
// `argv` returns the whole command line, read from .factory/config.yaml when the check runs.
export function commandCheck(size: TestSize, argv: (n: number) => string[]): Check {
  return {
    size,
    async run({ host, n }: Ctx): Promise<CheckResult> {
      const [cmd = "", ...args] = argv(n);
      const r = await host.exec(cmd, args);
      return { ok: r.code === 0, evidence: tail(r.output) || `exit ${r.code}` };
    },
  };
}
