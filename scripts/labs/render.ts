import type { Lab, Lane } from "./catalog.ts";
import type { Progress } from "./progress.ts";

type Stat = { lane: Lane; done: number; total: number };

// NO_COLOR always wins; FORCE_COLOR helps in CI logs; otherwise only a terminal gets color.
export function colorEnabled(env: Record<string, string | undefined>, isTTY: boolean): boolean {
  if (env.NO_COLOR) return false;
  if (env.FORCE_COLOR) return true;
  return isTTY;
}

const CODES = { bold: 1, dim: 2, red: 31, green: 32, yellow: 33, cyan: 36 } as const;
export function paint(color: boolean, style: keyof typeof CODES, text: string): string {
  return color ? `\u001b[${CODES[style]}m${text}\u001b[0m` : text;
}

export function bar(done: number, total: number, width: number, color: boolean): string {
  const filled = total === 0 ? 0 : Math.round((done / total) * width);
  return paint(color, "green", "█".repeat(filled)) + "░".repeat(width - filled);
}

// Backticked commands stand out, so a learner finds what to type.
function commands(text: string, color: boolean): string {
  return text.replace(/`([^`]+)`/g, (_m, cmd: string) => `\`${paint(color, "cyan", cmd)}\``);
}

export function renderMap(
  stats: Stat[],
  labs: Lab[],
  progress: Progress,
  currentId: string | undefined,
  color: boolean,
): string {
  const lines = [paint(color, "bold", "Lab map"), ""];
  for (const s of stats) {
    lines.push(`${s.lane.padEnd(9)} ${bar(s.done, s.total, 20, color)} ${s.done}/${s.total}`);
    for (const lab of labs.filter((l) => l.lane === s.lane)) {
      const mark = lab.id in progress.done ? paint(color, "green", "done") : "    ";
      const here = lab.id === currentId ? paint(color, "yellow", " <- you are here") : "";
      lines.push(`  ${mark} ${lab.id}  ${lab.title}${here}`);
    }
  }
  return lines.join("\n");
}

export function renderBrief(lab: Lab, progress: Progress, color: boolean): string {
  const shown = progress.hints[lab.id] ?? 0;
  const lines = [
    paint(color, "bold", `${lab.id}  ${lab.title}`),
    paint(color, "dim", `Pairs with ${lab.pairs}`),
    "",
    `${paint(color, "bold", "Goal")} ${lab.goal}`,
    "",
    paint(color, "bold", "Steps"),
    ...lab.steps.map((s, i) => `${i + 1}. ${commands(s, color)}`),
    "",
    paint(
      color,
      "dim",
      `Hints: ${shown} of ${lab.hints.length} revealed. Reveal the next with: make lab HINT=1`,
    ),
  ];
  for (let i = 0; i < shown; i++)
    lines.push(`Hint ${i + 1}: ${commands(lab.hints[i] ?? "", color)}`);
  return lines.join("\n");
}
