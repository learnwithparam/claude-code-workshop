import { planDrift, readArtifact } from "../artifacts.ts";
import type { Check } from "../types.ts";

export const planDriftCheck: Check = {
  size: "small",
  async run({ host, n }) {
    const stray = planDrift(await readArtifact(host, n, "plan.md"), await host.changedFiles(), n);
    return stray.length
      ? {
          ok: false,
          evidence: `files outside plan.md: ${stray.join(", ")}. Update plan.md in the same change.`,
        }
      : { ok: true, evidence: "diff stays inside plan.md" };
  },
};
