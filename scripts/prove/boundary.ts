import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { blocks } from "../../.claude/hooks/pretooluse-secrets.mjs";
import type { Proof } from "./hand-built.ts";

const ENV_NAME = ".env";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

// Boundary claim: a secret lives in one process. The browser, the image and Claude's shell never hold it.
export function proveBoundary(): Proof {
  const problems: string[] = [];
  const settings = JSON.parse(readFileSync(".claude/settings.json", "utf8"));
  const deny: string[] = settings.permissions?.deny ?? [];
  if (!deny.includes(`Read(**/${ENV_NAME}*)`)) problems.push("settings: Read deny missing");
  if (!deny.includes("Bash(git push *)")) problems.push("settings: git push deny missing");
  if (!settings.sandbox?.enabled) problems.push("settings: sandbox off");
  if (!settings.sandbox?.filesystem?.denyRead?.includes(`**/${ENV_NAME}*`))
    problems.push("settings: sandbox denyRead missing");
  if (!JSON.stringify(settings.hooks?.PreToolUse).includes("pretooluse-secrets"))
    problems.push("settings: guard hook not wired");

  // The trap: a Read deny does not cover Bash, so the hook has to.
  for (const cmd of [`cat api/${ENV_NAME}`, `grep KEY ${ENV_NAME}`, `source ./${ENV_NAME}`])
    if (!blocks(cmd)) problems.push(`hook lets through: ${cmd}`);
  for (const cmd of [`cat api/${ENV_NAME}.example`, "ls api"])
    if (blocks(cmd)) problems.push(`hook blocks a safe command: ${cmd}`);

  if (!existsSync("web/dist")) problems.push("web/dist missing: build first");
  else
    for (const file of walk("web/dist"))
      if (/sk-ant-/.test(readFileSync(file, "latin1"))) problems.push(`secret in ${file}`);

  for (const file of walk("web/src").filter((f) => /\.(ts|astro)$/.test(f))) {
    for (const m of readFileSync(file, "utf8").matchAll(/import\.meta\.env\.(\w+)/g))
      if (!m[1]?.startsWith("PUBLIC_")) problems.push(`${file} reads ${m[1]}`);
  }
  if (readdirSync("web").some((n) => n.startsWith(ENV_NAME))) problems.push("web has an env file");
  if (
    /adapter|integrations/.test(readFileSync("web/astro.config.mjs", "utf8").replace(/\/\/.*/g, ""))
  )
    problems.push("web has a server adapter");

  const docker = readFileSync("api/Dockerfile", "utf8");
  if (/^\s*(ARG|ENV)\s+\w*(KEY|SECRET|TOKEN)/im.test(docker))
    problems.push("Dockerfile bakes a secret");
  if (!readFileSync("api/.dockerignore", "utf8").includes(`${ENV_NAME}*`))
    problems.push(".dockerignore does not drop env files");

  // gitleaks must bite: a fake key in a scratch directory has to be found.
  const scratch = mkdtempSync(join(tmpdir(), "l1-"));
  writeFileSync(join(scratch, "leak.txt"), `key = sk-ant-api03-${"a1B2c3D4".repeat(5)}\n`);
  let caught = false;
  try {
    execFileSync("gitleaks", ["dir", scratch, "-c", ".gitleaks.toml", "--no-banner"], {
      stdio: "ignore",
    });
  } catch {
    caught = true;
  }
  if (!caught) problems.push("gitleaks did not flag a fake key");
  if (!existsSync("scripts/git/pre-commit")) problems.push("pre-commit hook script missing");

  return {
    level: "boundary",
    claim: "the key exists only in api; the bundle, image and shell cannot reach it",
    passed: problems.length === 0,
    detail: problems.length === 0 ? "boundary holds" : problems.join(" | "),
  };
}
