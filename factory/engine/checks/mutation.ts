import type { Check } from "../types.ts";

// --mutate takes a comma list of globs, so a name with one of these could add or cancel files.
const GLOB_CHARS = /[,!*?[\]{}()]/;
const SOURCE = /^shared\/src\/(?!.*\.test\.ts$).+\.ts$/;

// Mutation testing only the files this run changed: a whole-repo score would punish the run for old gaps.
export const mutation: Check = {
  size: "large",
  async run({ host }) {
    const files = (await host.changedFiles()).filter((f) => SOURCE.test(f));
    const odd = files.find((f) => GLOB_CHARS.test(f));
    if (odd)
      return { ok: false, evidence: `refusing to mutate "${odd}": the name has glob characters` };
    if (files.length === 0) return { ok: true, evidence: "no changed source file to mutate" };
    const r = await host.exec("npx", ["stryker", "run", "--mutate", files.join(",")]);
    const tail = r.output.trim().split("\n").slice(-25).join("\n");
    return { ok: r.code === 0, evidence: tail || `exit ${r.code}` };
  },
};
