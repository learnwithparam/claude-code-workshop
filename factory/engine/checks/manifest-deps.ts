import type { Check, Host } from "../types.ts";

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const isManifest = (f: string) => /(^|\/)package\.json$/.test(f);
const isLockfile = (f: string) => /(^|\/)package-lock\.json$/.test(f);
// A plain version or range. This refuses file:, link:, git, URL and npm: alias specs, which can pull code from anywhere.
const VERSION = /^[~^]?\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const REGISTRY = "https://registry.npmjs.org/";

type Json = Record<string, unknown>;

// Everything in a manifest except its dependency versions: scripts, workspaces, engines.
function withoutDependencies(doc: Json): string {
  const rest = { ...doc };
  for (const field of DEPENDENCY_FIELDS) delete rest[field];
  return JSON.stringify(rest);
}

// Problems in the dependency maps: the same packages as before, and every changed value a plain version.
function dependencyProblems(base: Json, head: Json): string[] {
  const problems: string[] = [];
  for (const field of DEPENDENCY_FIELDS) {
    const before = (base[field] ?? {}) as Record<string, string>;
    const after = (head[field] ?? {}) as Record<string, string>;
    if (Object.keys(before).sort().join() !== Object.keys(after).sort().join())
      problems.push(`${field} adds or removes a package`);
    for (const [name, spec] of Object.entries(after))
      if (spec !== before[name] && !VERSION.test(spec)) problems.push(`${name} is "${spec}"`);
  }
  return problems;
}

const resolvedUrls = (lock: Json): Set<string> =>
  new Set(
    Object.values((lock.packages ?? {}) as Record<string, { resolved?: string }>)
      .map((p) => p.resolved)
      .filter((r): r is string => typeof r === "string"),
  );

async function baseJson(host: Host, file: string): Promise<Json | null> {
  const r = await host.exec("git", ["show", `HEAD:${file}`], { ref: "base" });
  try {
    return r.code === 0 ? (JSON.parse(r.output) as Json) : null;
  } catch {
    return null;
  }
}

async function headJson(host: Host, file: string): Promise<Json | null> {
  try {
    return JSON.parse((await host.read(file)) ?? "") as Json;
  } catch {
    return null;
  }
}

// A dependency update may change versions and nothing else. The scripts in a manifest are what the gate
// runs, and a lockfile resolution is code that gets installed, so an agent that could point either at its
// own file could pass the gate without proving anything. A file that cannot be compared fails closed.
export const manifestDeps: Check = {
  size: "small",
  async run({ host }) {
    const problems: string[] = [];
    for (const file of (await host.changedFiles()).filter((f) => isManifest(f) || isLockfile(f))) {
      const base = await baseJson(host, file);
      const head = await headJson(host, file);
      if (!base || !head) {
        problems.push(`${file} cannot be compared with the base`);
      } else if (isManifest(file)) {
        if (withoutDependencies(base) !== withoutDependencies(head))
          problems.push(`${file} changed more than dependency versions`);
        problems.push(...dependencyProblems(base, head).map((p) => `${file}: ${p}`));
      } else {
        const known = resolvedUrls(base);
        for (const url of resolvedUrls(head))
          if (!known.has(url) && !url.startsWith(REGISTRY))
            problems.push(`${file}: ${url} does not come from the npm registry`);
      }
    }
    return problems.length
      ? { ok: false, evidence: `${problems.join("; ")}. Revert those changes.` }
      : { ok: true, evidence: "manifests changed dependency versions from the registry only" };
  },
};
