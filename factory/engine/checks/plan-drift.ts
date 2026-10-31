import { artifactPath, planDrift, readArtifact } from "../artifacts.ts";
import { approvedAmendment } from "../plan-amendment.ts";
import type { Check } from "../types.ts";

export const planDriftCheck: Check = {
  size: "small",
  async run({ host, n }) {
    // A run with no plan has nothing to stay inside: that is a failed check the loop can act on, not a crash.
    if ((await host.read(artifactPath(n, "plan.md"))) === null)
      return { ok: false, evidence: `${artifactPath(n, "plan.md")} is missing. Write it first.` };
    const plan = await readArtifact(host, n, "plan.md");
    const first = planDrift(plan, await host.changedFiles(), n);
    if (!first.length) return { ok: true, evidence: "diff stays inside plan.md" };
    const amended = await approvedAmendment(host, n);
    const stray = first.filter((f) => !amended.paths.includes(f));
    if (!stray.length)
      return { ok: true, evidence: "diff stays inside plan.md and its approved amendment" };
    const why = amended.problem ? ` ${amended.problem}.` : "";
    return {
      ok: false,
      evidence: `files outside plan.md: ${stray.join(", ")}. Update plan.md, or propose them in specs/${n}/plan-amendment.md.${why}`,
    };
  },
};
