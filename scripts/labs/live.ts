import type { Lab } from "./catalog.ts";
import { type CliDeps, finish } from "./cli.ts";
import type { Progress } from "./progress.ts";
import { paint, renderExpect, renderGoalItems, renderStep, rule } from "./render.ts";

export type LiveDeps = CliDeps & { enter: () => Promise<void> };

// One step on screen at a time, so the learner does it before reading what comes next.
// Expect stays hidden until Enter: the learner compares their screen to it, not the reverse.
export async function runLive(lab: Lab, progress: Progress, deps: LiveDeps): Promise<number> {
  const c = deps.color;
  deps.out(paint(c, "bold", `${lab.id}  ${lab.title}`));
  deps.out(rule(c));
  deps.out(`${paint(c, "bold", "Goal")} ${lab.goal}`);
  deps.out(`${paint(c, "bold", "Predict first")} ${lab.predict.question}`);
  deps.out("");

  if (lab.help === "goal") {
    // A goal lab hides its steps by design, so live mode shows the proof and runs it.
    for (const line of renderGoalItems(lab, c)) deps.out(line);
  } else {
    for (const [i, step] of lab.steps.entries()) {
      deps.out(renderStep(lab, step, i, c));
      deps.out(paint(c, "dim", "   Do it, then press Enter."));
      await deps.enter();
      if (step.expect) deps.out(renderExpect(step, c));
      deps.out("");
    }
  }

  // Every item runs, so one red item never hides another.
  const results = lab.proof.map((item) => ({ item, result: deps.proof(item.command) }));
  for (const { item, result } of results) {
    const mark = result.ok ? paint(c, "green", "PASS") : paint(c, "red", "FAIL");
    deps.out(`${mark} ${item.text}`);
  }
  if (results.every((r) => r.result.ok)) {
    finish(deps, progress, lab);
    return 0;
  }
  deps.out(
    `\n${paint(c, "red", `FAIL ${lab.id}`)} fix the items marked FAIL, then run LIVE=1 make lab again.`,
  );
  return 1;
}
