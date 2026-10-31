export type Ticket = { number: number; title: string; body?: string };

// Everything before the first wildcard: two globs can only collide if one prefix starts the other.
const stem = (glob: string) => glob.replace(/[*?[{].*$/, "");

export const overlaps = (a: string[], b: string[]) =>
  a.some((x) => b.some((y) => stem(x).startsWith(stem(y)) || stem(y).startsWith(stem(x))));

// A ticket names the files it will change on one line: `touches: web/src/**, shared/src/render.ts`.
export function touches(t: Ticket): string[] {
  const line = /^touches:\s*(.+)$/im.exec(t.body ?? "");
  const globs = (line?.[1] ?? "").split(",");
  return globs.map((g) => g.trim()).filter(Boolean);
}

// Runs together only tickets whose file areas do not overlap. A ticket with no `touches:` line is
// unknown, so it runs alone rather than guessing.
export function schedule(tickets: Ticket[], max = 3) {
  const now: Ticket[] = [];
  const queued: Ticket[] = [];
  const taken: string[][] = [];
  for (const t of tickets) {
    const mine = touches(t);
    const free = mine.length > 0 && now.length < max && taken.every((o) => !overlaps(o, mine));
    if (free || now.length === 0) {
      now.push(t);
      taken.push(mine);
    } else queued.push(t);
  }
  return { now, queued };
}
