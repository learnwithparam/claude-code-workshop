import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, matchesGlob } from "node:path";
import levels from "../levels.json" with { type: "json" };

// Teaching order. Trunk is always included; every level contains the levels before it.
export const LEVEL_ORDER = [
  "hand-built",
  "boundary",
  "context",
  "skills",
  "execution",
  "verification",
  "delivery",
] as const;
export type LevelName = (typeof LEVEL_ORDER)[number];

const manifest = levels as Record<string, string[]>;

export function filesFor(name: LevelName, all: string[]): string[] {
  const owned = ["trunk", ...LEVEL_ORDER.slice(0, LEVEL_ORDER.indexOf(name) + 1)];
  const globs = owned.flatMap((level) => manifest[level] ?? []);
  return all.filter((file) => globs.some((g) => matchesGlob(file, g)));
}

// A settings hook that points at a script this level does not have yet would error on every edit.
export function pruneHooks(settings: Record<string, unknown>, present: (p: string) => boolean) {
  const hooks = (settings.hooks ?? {}) as Record<string, { hooks: { command: string }[] }[]>;
  for (const [event, groups] of Object.entries(hooks)) {
    hooks[event] = groups.filter((group) =>
      group.hooks.every((h) => {
        const script = /\.claude\/hooks\/[\w.-]+/.exec(h.command)?.[0];
        return !script || present(script);
      }),
    );
    if (hooks[event]?.length === 0) delete hooks[event];
  }
  return settings;
}

export function generateLevel(name: LevelName, outDir: string, root = process.cwd()) {
  const all = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  const files = filesFor(name, all);
  rmSync(outDir, { recursive: true, force: true });
  for (const file of files) {
    mkdirSync(dirname(join(outDir, file)), { recursive: true });
    cpSync(join(root, file), join(outDir, file));
  }
  const settingsPath = join(outDir, ".claude/settings.json");
  if (existsSync(settingsPath)) {
    const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
    pruneHooks(settings, (p) => existsSync(join(outDir, p)));
    writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
    // Same formatter as the gate, so a generated file never fails the level's own lint.
    execFileSync(
      join(root, "node_modules/.bin/biome"),
      ["format", "--write", ".claude/settings.json"],
      {
        cwd: outDir,
        stdio: "ignore",
      },
    );
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = process.argv[2]?.replace(/^LEVEL=/, "");
  const picked = arg ? [arg] : [...LEVEL_ORDER];
  for (const name of picked) {
    if (!LEVEL_ORDER.includes(name as LevelName)) {
      console.error(`Unknown level "${name}". Levels: ${LEVEL_ORDER.join(", ")}`);
      process.exit(1);
    }
    const files = generateLevel(name as LevelName, join("supplied", name));
    console.log(`supplied/${name}: ${files.length} files`);
  }
}
