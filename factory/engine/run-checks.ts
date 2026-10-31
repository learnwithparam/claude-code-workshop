import { CHECKS } from "./checks/index.ts";
import type { CheckResult, Host } from "./types.ts";

export async function runChecks(
  host: Host,
  n: number,
  names: readonly string[],
): Promise<Record<string, CheckResult>> {
  const out: Record<string, CheckResult> = {};
  for (const name of names) {
    const check = CHECKS[name];
    if (!check) throw new Error(`unknown check ${name}`);
    out[name] = await check.run({ host, n });
  }
  return out;
}

export const failing = (r: Record<string, CheckResult>) => Object.entries(r).filter(([, v]) => !v.ok);
