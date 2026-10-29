import type { Check, CheckResult, Ctx, TestSize } from "../types.ts";

const tail = (s: string) => s.trim().split("\n").slice(-12).join("\n");

// A check that is only a command: it passes on exit 0 and the evidence is the end of its output.
export function commandCheck(size: TestSize, cmd: string, args: (n: number) => string[]): Check {
  return {
    size,
    async run({ host, n }: Ctx): Promise<CheckResult> {
      const r = await host.exec(cmd, args(n));
      return { ok: r.code === 0, evidence: tail(r.output) || `exit ${r.code}` };
    },
  };
}
