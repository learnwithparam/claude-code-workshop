import type { Check } from "../types.ts";

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const isManifest = (f: string) => /(^|\/)package\.json$/.test(f);

// Everything in a manifest except its dependency versions: scripts, workspaces, engines.
function withoutDependencies(json: string): string {
  const doc = JSON.parse(json) as Record<string, unknown>;
  for (const field of DEPENDENCY_FIELDS) delete doc[field];
  return JSON.stringify(doc);
}

// A dependency update may change versions and nothing else. The scripts in a manifest are what the gate
// runs, so an agent that could edit them could make the gate pass without proving anything.
export const manifestDeps: Check = {
  size: "small",
  async run({ host }) {
    const edited: string[] = [];
    for (const file of (await host.changedFiles()).filter(isManifest)) {
      const base = await host.exec("git", ["show", `HEAD:${file}`], { ref: "base" });
      const head = await host.read(file);
      // A manifest that is new, deleted or unreadable cannot be compared, so it fails closed.
      if (base.code !== 0 || head === null) {
        edited.push(file);
        continue;
      }
      try {
        if (withoutDependencies(base.output) !== withoutDependencies(head)) edited.push(file);
      } catch {
        edited.push(file);
      }
    }
    return edited.length
      ? {
          ok: false,
          evidence: `${edited.join(", ")} changed more than dependency versions. Revert the other fields.`,
        }
      : { ok: true, evidence: "manifests changed dependency versions only" };
  },
};
