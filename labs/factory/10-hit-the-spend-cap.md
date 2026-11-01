# Hit the spend cap

**Pairs with:** `docs/factory/f13-spend-and-safety.md`
**Help:** goal

## Warm-up

Which model does the docs build step run on?
From: factory-09
Answer: Haiku. The docs route replaces the build stage's model.

## Goal

Write .labs/work/cap.ts, which runs a three step workflow on a fake host where every agent call costs what you pass it, with a one dollar cap, and prints how the run ended. The proof must pass.

## Predict

The cap is one dollar and the run stops at 75 percent of it. Each call costs 80 cents. Does the second step run?

Answer: No. After the first call the run has spent 80 cents, which is past 75 percent, so it stops before the second step and asks a human.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Read the spend and safety doc.
3. Make the lab work folder.
4. [editor] Write .labs/work/cap.ts. It takes a per call cost from the command line, runs the workflow on a fake host and prints the outcome, the reason and the step it stopped at.
5. Run it with a cost of 0.8 and then 0.1.
   Expect: `needs-human spend cap build` for 0.8 and `done - -` for 0.1.

## Proof

1. A call that costs 80 cents stops the run before the build step.

   ```sh
   test "$(npx tsx .labs/work/cap.ts 0.8)" = "needs-human spend cap build"
   ```
2. A call that costs 50 cents crosses the line after build, so review never runs.

   ```sh
   test "$(npx tsx .labs/work/cap.ts 0.5)" = "needs-human spend cap review"
   ```
3. A cheap run finishes and reports no reason.

   ```sh
   test "$(npx tsx .labs/work/cap.ts 0.1)" = "done - -"
   ```

## Hints

1. `fakeHost` in `factory/engine/fake-host.ts` takes `{ agents: [{ costUsd }] }`. `runWorkflow` in `factory/engine/interpret.ts` runs a workflow on it.
2. The config comes from `loadConfig()` in `factory/config.ts`. Replace its spend with `{ capUsd: 1, stopAt: 0.75 }`.
3. The workflow has three steps: intent, build and review. `loadWorkflow` in `factory/engine/workflow.ts` reads it from text.
4. Commands: `cat docs/factory/f13-spend-and-safety.md`, `mkdir -p .labs/work`, `npx tsx .labs/work/cap.ts 0.8`, `npx tsx .labs/work/cap.ts 0.1`. The script is `import { loadConfig } from "../../factory/config.ts"; import { fakeHost } from "../../factory/engine/fake-host.ts"; import { runWorkflow } from "../../factory/engine/interpret.ts"; import { loadWorkflow } from "../../factory/engine/workflow.ts"; const wf = loadWorkflow("name: t\nmethod: m\nsource: s\nfor: f\nsteps:\n  - {stage: intent, agent: planner}\n  - {stage: build, agent: builder}\n  - {stage: review, agent: reviewer}"); const { host } = fakeHost({ agents: [{ costUsd: Number(process.argv[2]) }] }); runWorkflow(host, wf, 7, "t", { config: { ...loadConfig(), spend: { capUsd: 1, stopAt: 0.75 } } }).then((r) => console.log(r.outcome, r.reason ?? "-", r.stoppedAt ?? "-"));`.

## What you just learned

The cap is checked between steps against the spend so far. A run that crosses the line stops with needs-human and a reason, and the step it stopped before.
