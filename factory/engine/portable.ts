import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { z } from "zod";

const argv = z.array(z.string()).min(1);

// What a repo supplies so the engine runs on it unchanged: commands, paths and the name of the key source.
export const portableSchema = z.object({
  gate: argv,
  tests: z.object({
    unit: argv,
    e2e: argv,
    eval: argv,
    prose: argv,
    prepush: argv,
    mutation: argv,
  }),
  paths: z.object({ contract: z.string(), holdout: z.string(), source: z.string() }),
  keySource: z.object({ env: z.string(), file: z.string() }),
  protected: z.array(z.string()),
  planBrief: z.string().min(1),
});
export type Portable = z.infer<typeof portableSchema>;

export const loadPortable = (path = ".factory/config.yaml"): Portable =>
  portableSchema.parse(parse(readFileSync(path, "utf8")));

let cached: Portable | undefined;
// Read once per process; the checks and the workflow loader share it.
export const portable = (): Portable => {
  cached ??= loadPortable();
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
