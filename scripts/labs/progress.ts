import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";
import { LANES, type Lab, type Lane, PATH_IDS, PATHS, type PathId } from "./catalog.ts";

const progressSchema = z.object({
  done: z.record(z.string(), z.string()),
  hints: z.record(z.string(), z.number().int().min(0)),
  // The workshop the learner signed up for. Absent until they pick one.
  path: z.enum(PATH_IDS as [PathId, ...PathId[]]).optional(),
});
export type Progress = z.infer<typeof progressSchema>;

// A missing or damaged file is a fresh start, not a crash: the file is only a bookmark.
export function loadProgress(path: string): Progress {
  try {
    const parsed = progressSchema.safeParse(JSON.parse(readFileSync(path, "utf8")));
    if (parsed.success) return parsed.data;
  } catch {
    // fall through to a fresh start
  }
  return { done: {}, hints: {} };
}

export function saveProgress(path: string, progress: Progress): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(progress, null, 2)}\n`);
}

export function markDone(progress: Progress, id: string, when: string): Progress {
  return { ...progress, done: { ...progress.done, [id]: when } };
}

export function revealHint(progress: Progress, lab: Lab): { progress: Progress; revealed: number } {
  const revealed = Math.min((progress.hints[lab.id] ?? 0) + 1, lab.hints.length);
  return { progress: { ...progress, hints: { ...progress.hints, [lab.id]: revealed } }, revealed };
}

// Until a path is chosen every lane counts, so the map still has something to show.
export function lanesOf(progress: Progress): readonly Lane[] {
  return progress.path ? PATHS[progress.path] : LANES;
}

export function currentLab(labs: Lab[], progress: Progress): Lab | undefined {
  const lanes = lanesOf(progress);
  return lanes
    .flatMap((lane) => labs.filter((l) => l.lane === lane))
    .find((l) => !(l.id in progress.done));
}

export function laneStats(labs: Lab[], progress: Progress) {
  return lanesOf(progress).map((lane) => {
    const inLane = labs.filter((l) => l.lane === lane);
    return { lane, total: inLane.length, done: inLane.filter((l) => l.id in progress.done).length };
  });
}
