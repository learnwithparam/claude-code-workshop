import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { z } from "zod";
import { authMode } from "./auth.ts";

const argv = z.array(z.string()).min(1);

// What a repo supplies so the engine runs on it unchanged: commands, paths and the name of the key source.
export const portableSchema = z.object({
  gate: argv,
  tests: z.object({
    unit: argv,
    e2e: argv,
    eval: argv,
    // Prints `SCORE <number>`; the retro runs it before and after a lesson. Spends no tokens.
    score: argv,
    prose: argv,
    prepush: argv,
    mutation: argv,
  }),
  paths: z.object({ contract: z.string(), holdout: z.string(), source: z.string() }),
  keySource: z.object({ env: z.string(), file: z.string() }),
  auth: authMode,
  subscriptionCap: z.object({
    calls: z.number().int().positive(),
    tokens: z.number().int().positive(),
  }),
  protected: z.array(z.string()),
  planBrief: z.string().min(1),
});
export type Portable = z.infer<typeof portableSchema>;

export const loadPortable = (path = ".factory/config.yaml"): Portable =>
  portableSchema.parse(parse(readFileSync(path, "utf8")));

// The file as committed at `ref`, so nothing written to the working tree can change it.
export const loadPortableAt = (ref: string, cwd = process.cwd()): Portable =>
  portableSchema.parse(
    parse(execFileSync("git", ["show", `${ref}:.factory/config.yaml`], { cwd, encoding: "utf8" })),
  );

let cached: Portable | undefined;
// Read once per process; the checks and the workflow loader share it.
export const portable = (): Portable => {
  cached ??= loadPortable();
  return cached;
};

// Called before the first agent runs, so a build that edits the file cannot change the commands
// the gate runs: the working tree is never read for this again.
export const pinPortable = (path?: string): Portable => {
  cached = loadPortable(path);
  return cached;
};

// The same pin read from the base commit, so a tree edited before the run is not trusted either.
export const pinPortableAt = (ref: string, cwd?: string): Portable => {
  cached = loadPortableAt(ref, cwd);
  return cached;
};

// ** crosses folders, * stays inside one.
export function globToRegExp(glob: string): RegExp {
  const body = glob
    .split("**/")
    .map((part) => part.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*"))
    .join("(?:.*/)?");
  return new RegExp(`^${body}$`);
}
