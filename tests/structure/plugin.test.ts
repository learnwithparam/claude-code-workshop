import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { z } from "zod";
import { buildPlugin, KIT, PLUGIN_DIR } from "../../scripts/plugin.ts";

const read = (p: string) => readFileSync(p, "utf8");
const files = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => relative(dir, join(e.parentPath, e.name)))
    .sort();

const manifest = z.object({
  name: z.string().regex(/^[a-z][a-z0-9-]*$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().min(20),
  author: z.object({ name: z.string() }),
});
const marketplace = z.object({
  name: z.string(),
  description: z.string(),
  owner: z.object({ name: z.string() }),
  plugins: z.array(z.object({ name: z.string(), source: z.string(), description: z.string() })),
});

const plugin = manifest.parse(JSON.parse(read(join(PLUGIN_DIR, ".claude-plugin/plugin.json"))));

describe("factory-kit plugin", () => {
  it("is a byte copy of .claude/, so there is one place to edit", () => {
    const fresh = mkdtempSync(join(tmpdir(), "kit-"));
    buildPlugin(process.cwd(), fresh);
    for (const sub of ["skills", "agents"]) {
      expect(files(join(PLUGIN_DIR, sub)), `${sub} drifted: run npx tsx scripts/plugin.ts`).toEqual(
        files(join(fresh, sub)),
      );
      for (const f of files(join(fresh, sub)))
        expect(read(join(PLUGIN_DIR, sub, f)), `${sub}/${f} differs`).toBe(
          read(join(fresh, sub, f)),
        );
    }
    for (const hook of KIT.hooks)
      expect(read(join(PLUGIN_DIR, "hooks", hook))).toBe(read(join(".claude/hooks", hook)));
  });

  it("carries only the listed skills and agents, none of the app's own", () => {
    expect(readdirSync(join(PLUGIN_DIR, "skills")).sort()).toEqual([...KIT.skills].sort());
    expect(files(join(PLUGIN_DIR, "agents"))).toEqual(KIT.agents.map((a) => `${a}.md`).sort());
    expect(existsSync(join(PLUGIN_DIR, "skills/worksheet-bands"))).toBe(false);
  });

  it("gives every skill and agent a name that matches its file and a description", () => {
    const heads = [
      ...KIT.skills.map((n) => [n, join(PLUGIN_DIR, "skills", n, "SKILL.md")] as const),
      ...KIT.agents.map((n) => [n, join(PLUGIN_DIR, "agents", `${n}.md`)] as const),
    ];
    for (const [name, file] of heads) {
      const head = parse(/^---\s*\n([\s\S]*?)\n---/.exec(read(file))?.[1] ?? "");
      expect(head?.name, file).toBe(name);
      expect(String(head?.description ?? "").length, file).toBeGreaterThan(20);
    }
  });

  it("points every hook at a file inside the plugin, never at the project folder", () => {
    const raw = read(join(PLUGIN_DIR, "hooks/hooks.json"));
    expect(raw).not.toContain("CLAUDE_PROJECT_DIR");
    const scripts = [...raw.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([\w./-]+)/g)].map(
      (m) => m[1] ?? "",
    );
    expect(scripts.length).toBeGreaterThan(0);
    for (const s of scripts) expect(existsSync(join(PLUGIN_DIR, s)), s).toBe(true);
  });

  it("is listed in the marketplace at a path that resolves", () => {
    const market = marketplace.parse(JSON.parse(read(".claude-plugin/marketplace.json")));
    const entry = market.plugins.find((p) => p.name === plugin.name);
    expect(entry, "marketplace does not list the plugin").toBeDefined();
    expect(existsSync(join(entry?.source ?? "", ".claude-plugin/plugin.json"))).toBe(true);
  });

  it("has an eval that says when to fire and one that says when to stay out", () => {
    const cases = readdirSync(join(PLUGIN_DIR, "evals")).sort();
    expect(cases).toEqual(["stays-out-of-unrelated", "triages-a-bug"]);
    for (const c of cases) {
      expect(existsSync(join(PLUGIN_DIR, "evals", c, "prompt.md"))).toBe(true);
      expect(readdirSync(join(PLUGIN_DIR, "evals", c, "graders")).length).toBeGreaterThan(0);
    }
  });

  // Users only get an update when `version` changes, so a content change without a bump ships nothing.
  it("bumps the version when its files changed since the last tag", () => {
    let tag = "";
    try {
      tag = execFileSync("git", ["describe", "--tags", "--abbrev=0"], { encoding: "utf8" }).trim();
    } catch {
      return; // a shallow clone or a snapshot has no tag to compare with
    }
    const sh = (...a: string[]) => execFileSync("git", a, { encoding: "utf8" });
    const changed = sh("diff", "--name-only", tag, "--", PLUGIN_DIR)
      .split("\n")
      .filter((f) => f && !f.endsWith(".claude-plugin/plugin.json"));
    if (changed.length === 0) return;
    let before = "";
    try {
      before = sh("show", `${tag}:${PLUGIN_DIR}/.claude-plugin/plugin.json`);
    } catch {
      return; // the tag predates the plugin
    }
    expect(plugin.version, `${changed[0]} changed since ${tag}; bump version`).not.toBe(
      manifest.parse(JSON.parse(before)).version,
    );
  });
});
