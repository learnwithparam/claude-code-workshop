# Walkthrough: the factory lane, done live

You follow this by typing the same commands. Everything in a code block under "What I got" was captured by running that command in this repo. Your wording will differ a little. The lab files are the source of truth: [write an intent](../../labs/factory/01-write-intent.md), [acceptance first](../../labs/factory/02-acceptance-first.md), [dry run](../../labs/factory/03-dry-run-the-factory.md), [workflow contract](../../labs/factory/04-run-the-contract.md). The command list for `make lab` is in the [labs README](README.md).

## The end result

When you finish you have four files under `.labs/work/`, and each is one stage of a factory run made by hand:

- an `intent.md` with a checkable "Done when": the contract every later stage tests against
- an `acceptance.md` with scenarios written before any code exists
- a `dry-run.txt` that shows every stage, its model and its budget before a cent is spent
- a `contract.log` showing that every workflow in `.factory/workflows/` still agrees with the engine

Your work stays under `.labs/work/`, which git ignores, so no tracked file changes.

## Before you start

Window: shell, in the repo root.

```sh
make lab PATH_ID=factory
```

This picks the Software Factory workshop. Its path runs the `start` and `daily` labs first, so `make lab` opens on [start-01](walkthrough-start.md). Do those two lanes with their walkthroughs: [start](walkthrough-start.md) and [daily](walkthrough-daily.md). When you reach the factory lane, jump straight to it with `make lab ID=factory-01`. Each lab is red on purpose, so run it first and read the failure before you change anything.

You need no API key for this lane. The dry run and the contract test cost nothing. When you later run a real stage, pick how it signs in with [auth modes](../factory/auth-modes.md).

## factory-01: Turn a ticket into an intent

Pairs with [F1 Plan](../factory/f1-plan.md).

**The problem.** Without a written intent, a stage has nothing to test the work against, so "done" means whatever the model says it means.

**Type**

Window: shell for the red run and the folder, editor for the file.

```sh
make lab ID=factory-01
mkdir -p .labs/work/specs/1
```

Then write `.labs/work/specs/1/intent.md` with three headings, `## Problem`, `## Done when` and `## Out of scope`. Under Done when, give two bullets that each name a command in backticks, such as ``- `make check` exits 0``.

```sh
make lab ID=factory-01
```

**What I got**

The first run is red on purpose. The proof lines, trimmed:

```text
FAIL intent.md has a Problem heading.
grep: .labs/work/specs/1/intent.md: No such file or directory
FAIL intent.md has a Done when heading.
FAIL intent.md has an Out of scope heading.
FAIL intent.md has at least two bullet lines.
FAIL intent.md has all three headings, and its Done when bullets name commands that exist.

RED, as expected factory-01 this is the first run, so the proof fails on purpose.
The FAIL lines above are the state your steps will change. Do the steps, then run make lab again.
make: *** [lab] Error 1
```

One line, `sh: line 0: test: : integer expression expected`, also appears while the file is missing. It is harmless noise and goes away once the file exists. I did not run the green pass here, because it needs your own intent text.

## factory-02: Write acceptance before code

Pairs with [F2 Design](../factory/f2-design.md).

**The problem.** Without scenarios written first, tests get written to match the code, so they pass whatever the code does.

**Type**

Window: shell for the commands, editor for the file.

```sh
make lab ID=factory-02
cat .labs/work/specs/1/intent.md
```

Then write `.labs/work/specs/1/acceptance.md` with two scenarios. Each is three lines that start at the left edge: `Given`, `When`, `Then`. Make each Then something a program can assert, such as a status code or a file. A Then that says "looks good" or "works" fails the proof on purpose.

```sh
make lab ID=factory-02
```

**What I got**

The red run fails the same way as the first lab, on `acceptance.md` instead of `intent.md`. I did not run the green pass here, because it needs your own scenarios.

## factory-03: See what a run would do

Pairs with [F3 Build](../factory/f3-build.md).

**The problem.** Without a dry run, the first time you see what a run costs is when it has already spent it.

**Type**

Window: shell, for every step.

```sh
make lab ID=factory-03
mkdir -p .labs/work
make factory ISSUE=1 FLAGS=--dry-run | tee .labs/work/dry-run.txt
cat .factory/config.json
make lab ID=factory-03
```

**What I got**

The dry run reads the config and calls no model:

```text
Issue #1: stages that would run, from .factory/config.json
  triage  claude-haiku-5-5 turns<=4 budget<=$0.1 plan
  plan    claude-sonnet-5-5 turns<=12 budget<=$0.5 plan
  build   claude-sonnet-5-5 turns<=40 budget<=$3 acceptEdits
  review  claude-sonnet-5-5 turns<=15 budget<=$0.5 plan
  verify  claude-haiku-5-5 turns<=20 budget<=$0.3 plan
  adr     claude-haiku-5-5 turns<=6 budget<=$0.2 plan
  delivery claude-opus-5-5 turns<=6 budget<=$0.5 plan
  retro   claude-haiku-5-5 turns<=6 budget<=$0.2 plan
  review loop: at most 3 rounds, then label needs-human
```

The largest budget is `build` at $3. The cheap, mechanical stages use Haiku, and only `delivery` uses Opus. See [F12 model routing](../factory/f12-model-routing.md) for why.

## factory-04: Check the workflow contract

Pairs with [F8 Workflows](../factory/f8-workflows.md).

**The problem.** Without a test that walks every workflow, an edit to one YAML file breaks a run weeks later, on a ticket nobody was watching.

**Type**

Window: shell, for every step.

```sh
make lab ID=factory-04
mkdir -p .labs/work
npx vitest run factory/engine/workflows.test.ts > .labs/work/contract.log 2>&1
tail -8 .labs/work/contract.log
make lab ID=factory-04
```

**What I got**

The end of `contract.log`:

```text
 ✓ factory/engine/workflows.test.ts (128 tests) 45ms

 Test Files  1 passed (1)
      Tests  128 passed (128)
```

The test loads every file in `.factory/workflows/`, so one bad workflow fails it by name. Change a stage in one file, rerun, and read which workflow broke.

## factory-05: Run the checks that stop a bad test

**Pairs with** [F4 Test](../factory/f4-test.md)

**The problem.** "The tests pass" is the model's word until a check reproduces it. The checks (plan-drift, holdout, mutation, manifest-deps) are code with tests of their own.

```sh
make lab ID=factory-05
mkdir -p .labs/work
npx vitest run factory/engine/checks > .labs/work/checks.log 2>&1
grep '✓' .labs/work/checks.log
make lab ID=factory-05
```

**What I got.** The log lists `manifest-deps.test.ts` (23 tests), `mutation.test.ts` (3), `holdout.test.ts` (2) and `plan-drift.test.ts` (10), and ends with `Tests 38 passed (38)`. I ran the vitest command and read this output. I did not run the final green `make lab` here.

## factory-06: Count the votes behind a review

**Pairs with** [F5 Review](../factory/f5-review.md)

**The problem.** One agent's opinion is not a finding. The engine keeps a finding only when enough verifiers agree, and it caps nits and rounds.

```sh
make lab ID=factory-06
mkdir -p .labs/work
npx tsx -e 'import("./factory/engine/review.ts").then(m=>console.log("voters",m.VOTERS,"needed",m.NEEDED,"nits",m.MAX_NITS,"rounds",m.MAX_ROUNDS))' > .labs/work/review-rules.txt
npx vitest run factory/engine/review.test.ts > .labs/work/review.log 2>&1
make lab ID=factory-06
```

**What I got.** `review-rules.txt` holds `voters 3 needed 2 nits 3 rounds 3`, and `review.log` shows `factory/engine/review.test.ts (12 tests)` and `Tests 12 passed (12)`. The proof prints the constants again and compares, so a typed number fails. I did not run the final green `make lab` here.

## factory-07: Trip a band and read the intent it writes

**Pairs with** [F7 Maintain](../factory/f7-maintain.md)

**The problem.** Maintain is arithmetic. A metric that leaves its band by three sigma writes the `intent.md` a new run starts from, with no model involved.

You pick a number for `ci-failure-rate` against a fixed history of ten runs, then save the intent the factory writes for it. The lab's own proof scripts show how to print the sigma and the action.

**What I got.** With the proof's history, a latest value of 30 gave `3 intent` and a latest value of 10 gave `0 none`. I ran both through `detect` and `actionFor`. I did not run the final green `make lab` here.

## factory-08: Tier a diff and count its approvals

**Pairs with** [F6 Deploy](../factory/f6-deploy.md)

**The problem.** How much review a change needs is a property of its paths, not of who wrote it. `classify` reads the changed paths and `approvalsMet` counts distinct humans on one commit.

You write two small scripts: one prints the tier and count for the paths you pass, one says whether a high tier gate is open for the names you pass.

```sh
make lab ID=factory-08
mkdir -p .labs/work
# write .labs/work/tier.ts and .labs/work/approve.ts from hint 4
npx tsx .labs/work/tier.ts .github/workflows/check.yml
npx tsx .labs/work/approve.ts ann ann
make lab ID=factory-08
```

**What I got.** `.github/workflows/check.yml` gave `high 2`, `fixtures/worksheets.json` gave `low 0` and `web/src/pages/index.astro` gave `medium 1`. One person named twice gave `false` and two people gave `true`. I ran the lab's proof against a finished work folder and it passed, and against a script that prints `high 2` for every diff and it failed.

## factory-09: Route a step to its model

**Pairs with** [F12 Model routing](../factory/f12-model-routing.md)

**The problem.** The model for a step is not chosen in the workflow file. `resolveModel` reads the step name, maps it to a stage in `.factory/config.json`, and lets a ticket type's route replace the stage's model.

```sh
make lab ID=factory-09
mkdir -p .labs/work
# write .labs/work/route.ts from hint 4
npx tsx .labs/work/route.ts write docs
npx tsx .labs/work/route.ts write bug
make lab ID=factory-09
```

**What I got.** `build bug` gave `claude-sonnet-5-5`, `intent bug` gave `claude-haiku-5-5`, `write docs` gave `claude-haiku-5-5` and `write bug` gave `claude-sonnet-5-5`. The same step name, `write`, got two models because the ticket type differed. The proof passed on a finished script and failed on one that always prints the build model.

## factory-10: Hit the spend cap

**Pairs with** [F13 Spend and safety](../factory/f13-spend-and-safety.md)

**The problem.** A run that cannot stop is a bill. The runner adds up the cost of each call and stops between steps once the total crosses the share of the cap that the config names.

```sh
make lab ID=factory-10
mkdir -p .labs/work
# write .labs/work/cap.ts from hint 4
npx tsx .labs/work/cap.ts 0.8
npx tsx .labs/work/cap.ts 0.1
make lab ID=factory-10
```

**What I got.** With a one dollar cap and a stop at 75 percent, a call cost of 0.8 gave `needs-human spend cap build`, 0.5 gave `needs-human spend cap review` and 0.1 gave `done - -`. The proof passed on a finished script and failed on one that always prints the first line.

## Where to go after this lane

Pick the lab that matches your next job. The [cloud sessions](../factory/f11-cloud-sessions.md) lab `advanced-05` shows what a remote run inherits. The [assignments](../../assignments/README.md) each start from a gap in the factory and end in a test you write.
