import type { Lab } from "./catalog.ts";
import {
  currentLab,
  laneStats,
  loadProgress,
  markDone,
  type Progress,
  recordAttempt,
  revealHint,
  saveProgress,
} from "./progress.ts";
import { paint, renderBrief, renderMap } from "./render.ts";

export type CliDeps = {
  labs: Lab[];
  progressPath: string;
  color: boolean;
  proof: (command: string) => { ok: boolean; output: string };
  now: () => string;
  out: (text: string) => void;
};

const tail = (text: string, n: number) => text.trimEnd().split("\n").slice(-n).join("\n");

function showMap(deps: CliDeps, progress: Progress): void {
  const here = currentLab(deps.labs, progress)?.id;
  deps.out(renderMap(laneStats(deps.labs, progress), deps.labs, progress, here, deps.color));
}

function finish(deps: CliDeps, progress: Progress, lab: Lab): void {
  const c = deps.color;
  deps.out(`${paint(c, "green", `PASS ${lab.id}`)} ${lab.title}`);
  deps.out(`${paint(c, "bold", "What you just learned")} ${lab.learned}`);
  const after = markDone(progress, lab.id, deps.now());
  saveProgress(deps.progressPath, after);
  const next = currentLab(deps.labs, after);
  deps.out(next ? `\nNext: ${next.id} ${next.title}. Run: make lab` : "\nEvery lab is done.");
}

function hint(deps: CliDeps, progress: Progress, lab: Lab): void {
  if ((progress.hints[lab.id] ?? 0) >= lab.hints.length) {
    deps.out("No more hints. Read the steps again, then run make lab.");
  } else {
    saveProgress(deps.progressPath, revealHint(progress, lab).progress);
  }
  deps.out(renderBrief(lab, loadProgress(deps.progressPath), deps.color));
}

export function run(args: string[], deps: CliDeps): number {
  const [command = "progress", ...rest] = args;
  const id = rest.find((a) => !a.startsWith("--"));
  const progress = loadProgress(deps.progressPath);

  if (command === "progress") {
    showMap(deps, progress);
    return 0;
  }
  if (command !== "lab" && command !== "next") {
    deps.out("usage: make lab [ID=<id>] [HINT=1] | make next | make progress");
    return 2;
  }
  const wanted = command === "next" ? undefined : id;
  const lab = wanted ? deps.labs.find((l) => l.id === wanted) : currentLab(deps.labs, progress);
  if (!lab) {
    if (wanted) {
      deps.out(`Unknown lab "${wanted}". Labs: ${deps.labs.map((l) => l.id).join(", ")}`);
      return 2;
    }
    deps.out("Every lab is done. Run make progress for the map.");
    return 0;
  }
  if (command === "next") {
    deps.out(renderBrief(lab, progress, deps.color));
    return 0;
  }
  if (rest.includes("--hint")) {
    hint(deps, progress, lab);
    return 0;
  }

  deps.out(renderBrief(lab, progress, deps.color));
  deps.out(`\n${paint(deps.color, "dim", `Proof: ${lab.proof}`)}`);
  const result = deps.proof(lab.proof);
  if (result.ok) {
    finish(deps, progress, lab);
    return 0;
  }
  const first = (progress.attempts[lab.id] ?? 0) === 0;
  saveProgress(deps.progressPath, recordAttempt(progress, lab.id));
  if (first) {
    deps.out(
      `${paint(deps.color, "red", `RED, as expected ${lab.id}`)} this is the first run, so the proof fails on purpose.`,
    );
    deps.out(
      "The failing line below is the state your steps will change. Do the steps, then run make lab again.",
    );
  } else {
    deps.out(
      `${paint(deps.color, "red", `FAIL ${lab.id}`)} the proof is red. Finish the steps, then run make lab again.`,
    );
  }
  if (result.output.trim()) deps.out(tail(result.output, 6));
  return 1;
}
