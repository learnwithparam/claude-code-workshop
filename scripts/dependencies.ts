export type Manifest = {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

// Sibling apps must not drift: one range per package across every manifest. Internal packages are skipped.
export function findDrift(manifests: Record<string, Manifest>): string[] {
  const seen = new Map<string, Map<string, string[]>>();
  for (const [where, m] of Object.entries(manifests))
    for (const [dep, range] of Object.entries({ ...m.dependencies, ...m.devDependencies })) {
      if (dep.startsWith("@workshop/")) continue;
      const ranges = seen.get(dep) ?? new Map<string, string[]>();
      ranges.set(range, [...(ranges.get(range) ?? []), where]);
      seen.set(dep, ranges);
    }
  return [...seen]
    .filter(([, ranges]) => ranges.size > 1)
    .map(
      ([dep, ranges]) =>
        `${dep}: ${[...ranges].map(([r, w]) => `${r} in ${w.join(", ")}`).join(" vs ")}`,
    );
}

type Update = {
  "package-ecosystem"?: string;
  directory?: string;
  schedule?: { interval?: string };
  groups?: Record<string, { "update-types"?: string[] }>;
};

// Every npm manifest directory needs a weekly entry whose group takes minor and patch only,
// so a major bump arrives as its own PR.
export function checkDependabot(config: { updates?: Update[] }, directories: string[]): string[] {
  const npm = (config.updates ?? []).filter((u) => u["package-ecosystem"] === "npm");
  const problems = directories
    .filter((d) => !npm.some((u) => u.directory === d))
    .map((d) => `no dependabot entry for ${d}`);
  for (const u of npm) {
    if (u.schedule?.interval !== "weekly") problems.push(`${u.directory} is not weekly`);
    const types = Object.values(u.groups ?? {}).flatMap((g) => g["update-types"] ?? []);
    if (!types.length || types.some((t) => t !== "minor" && t !== "patch"))
      problems.push(`${u.directory} must group only minor and patch updates`);
  }
  return problems;
}
