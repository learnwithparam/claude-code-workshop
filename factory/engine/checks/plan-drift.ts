import { artifactPath, planDrift, readArtifact } from "../artifacts.ts";
import type { Check } from "../types.ts";

export const planDriftCheck: Check = {
  size: "small",
  async run({ host, n }) {
    // A run with no plan has nothing to stay inside: that is a failed check the loop can act on, not a crash.
    if ((await host.read(artifactPath(n, "plan.md"))) === null)
      return { ok: false, evidence: `${artifactPath(n, "plan.md")} is missing. Write it first.` };
    const stray = planDrift(await readArtifact(host, n, "plan.md"), await host.changedFiles(), n);
    return stray.length
      ? {
          ok: false,
          evidence: `files outside plan.md: ${stray.join(", ")}. Update plan.md in the same change.`,
        }
      : { ok: true, evidence: "diff stays inside plan.md" };
  },
};
