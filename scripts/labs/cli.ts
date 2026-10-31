import { type Lab, PATH_IDS, type PathId } from "./catalog.ts";
import {
  currentLab,
  laneStats,
  loadProgress,
  markDone,
  type Progress,
  revealHint,
  saveGuess,
  saveProgress,
} from "./progress.ts";
import { paint, renderBrief, renderMap } from "./render.ts";

export type CliDeps = {
  labs: Lab[];
  progressPath: string;
  color: boolean;
  guess?: string;
  proof: (command: string) => { ok: boolean; output: string };
  now: () => string;
  out: (text: string) => void;
  /** Redraws the result line in place (watch mode). */
  status: (text: string) => void;
  isTTY: boolean;
  /** Calls onChange when the learner's work changes; returns a stop function. Debounced by the caller. */
  watch?: (onChange: () => void) => () => void;
  /** Calls onKey for each key typed; returns a stop function. */
  keys?: (onKey: (key: string) => void) => () => void;
};

const tail = (text: string, n: number) => text.trimEnd().split("\n").slice(-n).join("\n");

function chooseText(): string {
  return [
    "Pick the workshop you signed up for. Run one of these:",
    "  make lab PATH_ID=pro       Claude Code, beginner to pro",
    "  make lab PATH_ID=factory   Software Factory",
  ].join("\n");
}

function showMap(deps: CliDeps, progress: Progress): void {
  const here = currentLab(deps.labs, progress)?.id;
  deps.out(renderMap(laneStats(deps.labs, progress), deps.labs, progress, here, deps.color));
  if (!progress.path) {
    deps.out(`\n${chooseText()}`);
    return;
  }
  const other = PATH_IDS.find((p) => p !== progress.path);
  deps.out(`\nThe other workshop's labs are hidden. Switch with: make lab PATH_ID=${other}`);
}

function finish(deps: CliDeps, progress: Progress, lab: Lab): void {
  const c = deps.color;
  deps.out(`${paint(c, "green", `PASS ${lab.id}`)} ${lab.title}`);
  const guess = progress.guesses?.[lab.id];
  deps.out(guess ? `Your guess: ${guess}` : "You saved no guess for this lab.");
  deps.out(`${paint(c, "bold", "Answer")} ${lab.predict.answer}`);
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
  let progress = loadProgress(deps.progressPath);
  const picked = rest.find((a) => a.startsWith("--path="))?.slice("--path=".length);

  if (picked !== undefined) {
    if (!PATH_IDS.includes(picked as PathId)) {
      deps.out(`Unknown path "${picked}".\n${chooseText()}`);
      return 2;
    }
    progress = { ...progress, path: picked as PathId };
    saveProgress(deps.progressPath, progress);
  }

  if (command === "progress") {
    showMap(deps, progress);
    return 0;
  }
  if (command !== "lab" && command !== "next") {
    deps.out(
      "usage: make lab [PATH_ID=pro|factory] [ID=<id>] [HINT=1] [GUESS=...] | make next | make progress",
    );
    return 2;
  }
  if (!progress.path) {
    deps.out(chooseText());
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

  const guess = deps.guess?.trim();
  if (guess) {
    progress = saveGuess(progress, lab.id, guess);
    saveProgress(deps.progressPath, progress);
  }
  deps.out(renderBrief(lab, progress, deps.color));
  deps.out("");
  // Run every item, so one red item never hides another.
  const results = lab.proof.map((item) => ({ item, result: deps.proof(item.command) }));
  for (const { item, result } of results) {
    const mark = result.ok ? paint(deps.color, "green", "PASS") : paint(deps.color, "red", "FAIL");
    deps.out(`${mark} ${item.text}`);
    if (!result.ok && result.output.trim())
      deps.out(paint(deps.color, "dim", tail(result.output, 3)));
  }
  if (results.every((r) => r.result.ok)) {
    finish(deps, progress, lab);
    return 0;
  }
  deps.out(
    `\n${paint(deps.color, "red", `FAIL ${lab.id}`)} fix the items marked FAIL, then run make lab again.`,
  );
  return 1;
}

const failLine = (deps: CliDeps, lab: Lab) =>
  `${paint(deps.color, "red", `FAIL ${lab.id}`)} the proof is red. It reruns when you save. h hint, q quit.`;

/** `make lab WATCH=1`: brief, proof, then rerun on each change until PASS or q. */
export async function runWatch(args: string[], deps: CliDeps): Promise<number> {
  const plain = args.filter((a) => a !== "--watch");
  const { watch, keys } = deps;
  if (!deps.isTTY || !watch || !keys) {
    deps.out("Watch needs a terminal; running the proof once.");
    return run(plain, deps);
  }
  // Picking or lacking a path is handled once by run, which saves it or asks for it.
  if (plain.some((a) => a.startsWith("--path=")) || !loadProgress(deps.progressPath).path) {
    return run(plain, deps);
  }
  const wanted = plain.slice(1).find((a) => !a.startsWith("--"));
  const lab = wanted
    ? deps.labs.find((l) => l.id === wanted)
    : currentLab(deps.labs, loadProgress(deps.progressPath));
  if (!lab) return run(plain, deps);

  deps.out(renderBrief(lab, loadProgress(deps.progressPath), deps.color));
  deps.out(`\n${paint(deps.color, "dim", `Proof: ${lab.proof}`)}`);
  return new Promise<number>((resolve) => {
    const stops: Array<() => void> = [];
    const end = (code: number) => {
      for (const stop of stops) stop();
      resolve(code);
    };
    const check = () => {
      const result = deps.proof(lab.proof);
      if (result.ok) {
        finish(deps, loadProgress(deps.progressPath), lab);
        return end(0);
      }
      deps.status(failLine(deps, lab));
      if (result.output.trim()) deps.out(tail(result.output, 6));
    };
    stops.push(watch(check));
    stops.push(
      keys((key) => {
        if (key === "q") end(1);
        else if (key === "h") hint(deps, loadProgress(deps.progressPath), lab);
      }),
    );
    check();
  });
}
