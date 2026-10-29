import { type Proposal, parseProposal } from "../retro.ts";
import type { Host } from "./types.ts";

export type RetroOutcome =
  | { kind: "none" }
  | { kind: "kept"; proposal: Proposal; before: number; after: number; delta: number }
  | { kind: "reverted"; proposal: Proposal; before: number; after: number; delta: number }
  | { kind: "error"; error: string };

// The score command prints a line `SCORE <number>`. Anything else is a broken eval, not a zero.
export async function score(host: Host, cmd: string, args: string[]): Promise<number> {
  const r = await host.exec(cmd, args);
  const m = /^SCORE\s+(-?\d+(?:\.\d+)?)\s*$/m.exec(r.output);
  if (!m) throw new Error(`${cmd} printed no SCORE line`);
  return Number(m[1]);
}

// The retro proposes one change, the eval runs before and after, and the change is kept only if the
// score did not fall. The PR shows delta, so a lesson is judged by the evals, not by the model's word.
export async function retro(
  host: Host,
  n: number,
  evalCmd: [string, ...string[]],
  revert: () => Promise<void>,
): Promise<RetroOutcome> {
  const [cmd, ...args] = evalCmd;
  const before = await score(host, cmd, args);
  const out = await host.agent("planner", `Run the factory-retro skill on specs/${n}/run.log.`, {
    stage: "retro",
  });
  const proposal = parseProposal(out.text);
  if (proposal === "none") return { kind: "none" };
  if ("error" in proposal) return { kind: "error", error: proposal.error };
  await host.agent(
    "builder",
    `Apply exactly this change to ${proposal.file} and touch nothing else: ${proposal.change}`,
    { stage: "retro" },
  );
  const stray = (await host.changedFiles()).filter((f) => f !== proposal.file);
  if (stray.length) {
    await revert();
    return { kind: "error", error: `retro touched more than its file: ${stray.join(", ")}` };
  }
  const after = await score(host, cmd, args);
  const delta = after - before;
  if (delta < 0) {
    await revert();
    return { kind: "reverted", proposal, before, after, delta };
  }
  return { kind: "kept", proposal, before, after, delta };
}
