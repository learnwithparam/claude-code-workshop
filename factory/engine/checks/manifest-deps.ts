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
// Other files that decide what npm, yarn or pnpm install. None of them is checked, so none may change.
const INSTALL_CONFIG = /(^|\/)(npm-shrinkwrap\.json|\.npmrc|yarn\.lock|pnpm-lock\.yaml)$/;

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

type LockEntry = { name?: string; version?: string; resolved?: string; link?: boolean };

// The only URL an entry may resolve to: the registry's tarball for exactly that package and version.
function registryUrl(key: string, entry: LockEntry): string {
  const name = entry.name ?? key.split("node_modules/").pop() ?? "";
  const file = name.split("/").pop();
  return `https://registry.npmjs.org/${name}/-/${file}-${entry.version}.tgz`;
}

// Entries whose resolution is new in the head lockfile and is not the registry tarball for their version.
function lockfileProblems(base: Json, head: Json): string[] {
  if (head.lockfileVersion !== 2 && head.lockfileVersion !== 3)
    return ["lockfileVersion is not 2 or 3"];
  const before = (base.packages ?? {}) as Record<string, LockEntry>;
  const problems: string[] = [];
  for (const [key, entry] of Object.entries((head.packages ?? {}) as Record<string, LockEntry>)) {
    const known = before[key];
    if (entry.link && !known?.link) problems.push(`${key} is a new link`);
    if (
      entry.resolved &&
      entry.resolved !== known?.resolved &&
      entry.resolved !== registryUrl(key, entry)
    )
      problems.push(
        `${key} resolves to ${entry.resolved}, not the registry tarball for ${entry.version}`,
      );
  }
  return problems;
}

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
    const changed = await host.changedFiles();
    for (const file of changed.filter((f) => INSTALL_CONFIG.test(f)))
      problems.push(`${file} is an install file this check does not cover`);
    for (const file of changed.filter((f) => isManifest(f) || isLockfile(f))) {
      const base = await baseJson(host, file);
      const head = await headJson(host, file);
      if (!base || !head) {
        problems.push(`${file} cannot be compared with the base`);
      } else if (isManifest(file)) {
        if (withoutDependencies(base) !== withoutDependencies(head))
          problems.push(`${file} changed more than dependency versions`);
        problems.push(...dependencyProblems(base, head).map((p) => `${file}: ${p}`));
      } else {
        problems.push(...lockfileProblems(base, head).map((l) => `${file}: ${l}`));
      }
    }
    return problems.length
      ? { ok: false, evidence: `${problems.join("; ")}. Revert those changes.` }
      : { ok: true, evidence: "manifests changed dependency versions from the registry only" };
  },
};
