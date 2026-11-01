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

## Turn a ticket into an intent

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

The red run, trimmed to the proof lines:

```text
FAIL intent.md has a Problem heading.
grep: .labs/work/specs/1/intent.md: No such file or directory
FAIL intent.md has a Done when heading.
FAIL intent.md has an Out of scope heading.
FAIL intent.md has at least two bullet lines.
FAIL intent.md has all three headings, and its Done when bullets name commands that exist.

RED, as expected factory-01 this is the first run, so the proof fails on purpose.
```

After you write the file, the same command reports every item as passed and records the lab. Not run in the sandbox: the green run, because it needs your own intent text.

## Write acceptance before code

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

The red run fails the same way as the first lab, on `acceptance.md` instead of `intent.md`. Not run in the sandbox: the green run, because it needs your own scenarios.

## See what a run would do

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

## Check the workflow contract

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
 ✓ factory/engine/workflows.test.ts (128 tests) 52ms

 Test Files  1 passed (1)
      Tests  128 passed (128)
```

The test loads every file in `.factory/workflows/`, so one bad workflow fails it by name. Change a stage in one file, rerun, and read which workflow broke.

## What this lane does not cover yet

The factory lane stops at the contract. Test, review, deploy and maintain have docs ([F4](../factory/f4-test.md), [F5](../factory/f5-review.md), [F6](../factory/f6-deploy.md), [F7](../factory/f7-maintain.md)) but no lab of their own yet. For a hands-on run past this lane, use the [cloud sessions](../factory/f11-cloud-sessions.md) lab `advanced-05`, then pick an [assignment](../factory/f10-assignments.md).
