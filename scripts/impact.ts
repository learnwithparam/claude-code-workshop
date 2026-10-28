import { z } from "zod";

const impactSchema = z
  .object({
    always: z.array(z.string()),
    workspaces: z.record(z.string(), z.array(z.string())),
    paths: z.record(z.string(), z.array(z.string())),
  })
  .superRefine((map, ctx) => {
    for (const [glob, targets] of Object.entries(map.paths))
      for (const t of targets)
        if (!map.workspaces[t])
          ctx.addIssue({ code: "custom", message: `${glob} names unknown workspace ${t}` });
  });

export type ImpactMap = z.infer<typeof impactSchema>;
export type Plan = { full: boolean; commands: string[] };

export const parseImpact = (repoJson: unknown): ImpactMap =>
  impactSchema.parse((repoJson as { impact?: unknown }).impact);

// Globs are "dir/**" prefixes; anything else is a literal path. No dependency analysis (hand-written map).
const matches = (glob: string, file: string) =>
  glob.endsWith("/**") ? file.startsWith(glob.slice(0, -2)) : file === glob;

// A file the map does not cover could reach anything, so it escalates to the full gate.
export function planChecks(map: ImpactMap, files: string[]): Plan {
  const commands = new Set(files.length ? map.always : []);
  for (const file of files) {
    const glob = Object.keys(map.paths).find((g) => matches(g, file));
    if (glob === undefined) return { full: true, commands: ["make check"] };
    for (const ws of map.paths[glob] ?? [])
      for (const c of map.workspaces[ws] ?? []) commands.add(c);
  }
  return { full: false, commands: [...commands] };
}
