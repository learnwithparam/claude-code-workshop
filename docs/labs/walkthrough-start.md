# Walkthrough: the start lane

Follow this beside the lab files in `labs/start/`. Every output block below was captured when the same command ran in a cloud sandbox with `NO_COLOR=1`. Your wording will differ wherever Claude wrote the text. Where a command could not run in the sandbox, the step says so and shows no output.

## What you will have at the end

- A file written by `claude -p` that you read yourself, which shows Claude Code works as a plain command.
- A test log for `shared/` that tells you what green looks like before Claude touches anything.
- A plan from Claude, written while it changed no tracked file, that you read before approving any work.
- A private note in `CLAUDE.local.md` that Claude follows in this repo and git never sees.

Keep a shell in the repo root for the commands. Later you can run `make lab WATCH=1` in a second shell to rerun the proof as you save, as described in [the labs README](README.md).

## Pick the workshop first

Window: shell.

```sh
make lab
```

Output:

```text
npx tsx scripts/labs/main.ts lab    
Pick the workshop you signed up for. Run one of these:
  make lab PATH_ID=pro       Claude Code, beginner to pro
  make lab PATH_ID=factory   Software Factory
make: *** [Makefile:61: lab] Error 2
```

```sh
make lab PATH_ID=pro
```

The first part of the output is the brief for `start-01` (goal, predict question, steps). It ends with the red proof:

```text
FAIL repo-tour.md has at least three non-empty lines.
grep: .labs/work/repo-tour.md: No such file or directory
sh: 1: test: Illegal number:
FAIL repo-tour.md has three lines and names a folder of this repo.
grep: .labs/work/repo-tour.md: No such file or directory
sh: 2: test: Illegal number:

RED, as expected start-01 this is the first run, so the proof fails on purpose.
The FAIL lines above are the state your steps will change. Do the steps, then run make lab again.
make: *** [Makefile:61: lab] Error 1
```

Notice: the non-zero exit and the `FAIL` lines are the lab working, not a break. The `Illegal number` lines are the proof failing on a file that does not exist yet.

Trick to keep: `make lab` with no argument asks, and never guesses. Pick once and every later command follows your workshop.

The mistake people make: reading `Error 1` as a broken install and stopping. The line that says `RED, as expected` is the one to read.

## start-01: ask Claude about the repo

Brief: [start-01](../../labs/start/01-first-prompt.md), pairing with [hand-built](../levels/hand-built.md).

Window: shell, all steps. Type your Predict guess first if you like: `make lab GUESS="nothing prints, the answer lands in the file"`. That command was not run in the sandbox.

Check the machine:

```sh
make doctor
```

```text
ok node v22.23.4
2.1.316 (Claude Code)
warn: gitleaks missing, make hooks will not scan commits
warn: gh not logged in, the factory needs it
```

Make the work folder and ask:

```sh
mkdir -p .labs/work
claude -p "In five bullets, what does this repo do?" > .labs/work/repo-tour.md
```

Output on screen: none. The sandbox did print a sandboxing warning on standard error, which a redirect with `>` does not capture. On a machine with the sandbox tools you will see nothing.

Read it:

```sh
cat .labs/work/repo-tour.md
```

```text
- **Worksheet Studio** turns a prompt into a printable worksheet: you describe what you want, and the app returns a filled-in worksheet.
- **Chat agent (Claude Haiku 5.5)** asks one clarifying question only if the grade level is unclear, then fills in the worksheet content.
- **`shared/`** holds the band table, schema, check and render code. The model supplies content, and this code decides layout.
- **`web/` and `api/`**: `web/` is a static Astro front end that reads only `PUBLIC_API_URL`. `api/` is a Hono server and the only process that holds `ANTHROPIC_API_KEY`.
- **`factory/`** is the runner that works on the repo itself. `make check` is the gate, and every boundary is validated with zod.

This summary comes from the project instructions (`AGENTS.md`), and I haven't opened the code.
```

Run the proof:

```sh
make lab
```

```text
PASS repo-tour.md has at least three non-empty lines.
PASS repo-tour.md has three lines and names a folder of this repo.
PASS start-01 Ask Claude about the repo
You saved no guess for this lab.
Answer Nothing prints and the answer lands in the file, because -p writes one answer to standard output and the redirect captures it.
What you just learned `claude -p` is Claude Code as a command: a question in, an answer out, no chat window.

Next: start-02 Run the gate yourself. Run: make lab
```

What to notice: the last line of the answer. Claude says it read `AGENTS.md` and did not open the code. A first answer comes from the instructions file, so the quality of that file sets the quality of the tour.

Trick to keep: `-p` plus `>` turns Claude into a step in a pipeline. Anything you can redirect, you can diff, grep or commit later.

The mistake people make: running `claude` without `-p` and then redirecting. That opens the chat window and the file stays empty.

## start-02: run the gate yourself

Brief: [start-02](../../labs/start/02-run-the-gate.md), pairing with [hand-built](../levels/hand-built.md).

Window: shell.

```sh
npm ci
```

The sandbox output ended with these lines. The lines above them were not kept, so only the end is shown:

```text
  npm audit fix --force

Some issues need review, and may require choosing
a different dependency.

Run `npm audit` for details.
```

Run the shared tests and keep the log, then read its end:

```sh
mkdir -p .labs/work && npx vitest run shared/ > .labs/work/gate.log 2>&1
tail -5 .labs/work/gate.log
```

The command exited with status 1 in the sandbox. This is the real tail:

```text
   Duration  1.89s (import 52%, transform 35%, tests 11%, worker 3%)

    Isolate  17 workers spawned · ~134ms startup each (spawn + environment, per file)
```

The log's final line, a speed hint about `isolate: false`, is left out here because it contains a dash that this repo's prose check rejects. Nothing else in the tail changed.

The lab expects a green log here. The sandbox gave a red one, and the cause is in the middle of the log, not in the tail. The summary lines read:

```text
 Test Files  1 failed | 16 passed (17)
      Tests  1 failed | 134 passed (135)
```

The failure was in `shared/src/workbook-pdf.test.ts`. It launches Chromium to render a PDF, and the sandbox has a different Chromium build from the one the installed Playwright wants:

```text
Caused by: Error: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell
```

The proof is red because of it:

```sh
make lab
```

```text
PASS gate.log says passed.
FAIL gate.log has no failed.
FAIL gate.log shows passed tests and names a test file under shared that exists.

RED, as expected start-02 this is the first run, so the proof fails on purpose.
The FAIL lines above are the state your steps will change. Do the steps, then run make lab again.
make: *** [Makefile:61: lab] Error 1
```

A green run was not reached here. What a learner on a machine with a matching browser sees was not run in the sandbox, so no output is claimed for it. If you hit the same error, run `npx playwright install` once and repeat the step.

What to notice: the first proof item passes while the second fails, because the word `passed` is in the log even when a test failed. The proof checks both on purpose.

Trick to keep: when the tail of a log looks harmless, search the whole file for the failure: `grep -n "FAIL" .labs/work/gate.log`. The cause is rarely in the last lines.

The mistake people make: assuming a red gate on a clean checkout means they broke something. Read the error first. Here it was a missing browser, not the code.

## start-03: plan before you edit

Brief: [start-03](../../labs/start/03-plan-first.md), pairing with [context](../levels/context.md).

Window: shell. Check the tree is clean first, run the command, then check again:

```sh
git status --short
claude -p --permission-mode plan "Plan how to add a grade band for adult learners to shared/. List the files and how you will verify it." > .labs/work/plan.md
git status --short
```

Both `git status --short` calls printed nothing. Plan mode changed no tracked file. Read the plan:

```sh
cat .labs/work/plan.md
```

```text
I've loaded the `worksheet-bands` skill and started an Explore agent on `shared/`. It's mapping the band table, `parseBand`, `checkBand`, the schema and render code, the existing tests, and every place outside `shared/` that lists bands. I'll write the plan once its findings come back.

I've written the plan to `/root/.claude/plans/plan-how-to-add-starry-sunrise.md`. I haven't changed any code. Plan mode is on, and I don't have an approval tool here, so please read it and tell me whether to build.

**What exists today:** `shared/src/bands.ts` is the single source of truth, with 7 bands from `early-reader` to `university`. Nothing branches on band id. The type system will point at every place that needs the new key.

**Proposed band `adult-learners`**
- It sits between `grade-9-12` and `university`. Existing tests require `maxItems` and `maxItemsPerPage` to be non-decreasing in table order, so the new values must fall between those two bands' limits.
- The values are Inter at 16px, 18 items (9 per page), 60 words per item, and no picture boxes.
- The activity kinds are fill-blank, table, steps, short and match.
- The aliases are "adult learner(s)", "adult education", "adult literacy", "adult" and "ged".

**Files**
- **Tests first:**
  - `shared/src/bands.test.ts` gets `parseBand` cases for the new band. It also checks that "grade 10" and "graduate" still map as before.
  - `tests/structure/bands.test.ts` already loops over every band. It will require each alias to round-trip and exactly one fixture.
- **Changes:**
  - `shared/src/bands.ts`: add the id and the table entry.
  - `fixtures/worksheets.json`: add one fixture that passes `checkBand`.
  - `specs/25/golden/__snapshots__/adult-learners.html`: add a new golden snapshot.
  - `shared/src/band-theme.ts`: touched only if I add a new art id.
- **Probably unchanged:**
  - `api/src/agent/prompt.ts` builds its list from the band table.
  - The schema, `check.ts` and the render code need no edits.
  - The `worksheet-bands` skill names no band ids, and editing it would also need a `skills.lock` update.

**Verification**
1. Write the tests and watch them fail.
2. Add the band, fixture and snapshot until they pass.
3. Run `make check` with zero errors and zero warnings. This covers the 4.5:1 theme contrast test, the sort-order tests and the golden test.
4. Run `make dev` and look at the new fixture at phone and desktop width.
5. `make smoke` and `make eval` spend tokens, so I'll run them only if you say so.

**Questions for you**
- Should the band reuse an existing art id or get a new one? I lean towards reuse, which keeps the change smaller.
- Are the limits right for your adult learners?
- "senior adult" would currently match `grade-9-12` through "senior". Does that matter?
- Should I update the "7/7" counts in `docs/levels/skills.md`? I'd leave `fixtures/eval.json` alone because it holds recorded results.

I haven't checked how `specs/25/lock.json` locks the golden snapshots. I'll look before writing the new one.
```

Run the proof:

```sh
make lab ID=start-03
```

```text
FAIL The plan mentions how you will verify it.
PASS The plan has at least five non-empty lines.
FAIL The plan says how to verify and names a file under shared that exists.

RED, as expected start-03 this is the first run, so the proof fails on purpose.
The FAIL lines above are the state your steps will change. Do the steps, then run make lab again.
make: *** [Makefile:61: lab] Error 1
```

The proof stayed red in the sandbox, and the reason is worth reading closely. The proof greps for the word `verify`. The plan says `Verification` as a heading and `verify` nowhere in that spelling, so the match fails even though the plan covers verification well. Asking again with the exact word, for example by ending the prompt with "Use the word verify in each step", is the fix the lab's third hint points at. That retry was not run in the sandbox.

What to notice: the plan itself went to a file outside the repo, `/root/.claude/plans/plan-how-to-add-starry-sunrise.md`, and what reached your redirect is Claude's chat summary of it. The summary ends with questions for you. A plan is a conversation opener, not an order.

Trick to keep: run `git status --short` before and after a plan-mode call. A clean tree twice is the proof it stayed read-only.

The mistake people make: treating the redirected text as the whole plan and as final. It is a summary, and the questions at the bottom are the decisions you still owe.

## start-04: teach Claude a personal habit

Brief: [start-04](../../labs/start/04-local-memory.md), pairing with [context](../levels/context.md).

Window: shell for every step. Claude Code itself is started by `claude -p` inside the command.

Look at the example and confirm you have no file yet:

```sh
ls CLAUDE.local.md
cat docs/examples/CLAUDE.local.md
```

```text
ls: cannot access 'CLAUDE.local.md': No such file or directory
# CLAUDE.local.md (example)

Copy this to `CLAUDE.local.md` at the repo root. Git ignores that file, so it stays yours.
It loads after `CLAUDE.md` and holds what only you need: your editor, your habits, your sandbox.

- I run on a laptop with 16 GB. Start `make check` in the background and tail its log.
- I prefer the Teaching output style while I learn: `/output-style Teaching`.
- My scratch notes live in `~/notes`. Never write them into the repo.
```

Add your line and read it back:

```sh
echo "- lab-note: explain each change in two plain sentences." >> CLAUDE.local.md
tail -1 CLAUDE.local.md
```

```text
- lab-note: explain each change in two plain sentences.
```

Ask Claude what it knows:

```sh
claude -p "What preferences do my local notes give you?"
```

```text
Your local notes (`CLAUDE.local.md`) contain one preference:

- **lab-note:** Explain each change in two plain sentences.

So when I make a change in this repo, I'll add a short note describing it in exactly two plain sentences.
```

Run the proof:

```sh
make lab ID=start-04
```

```text
PASS CLAUDE.local.md holds a lab-note.
PASS CLAUDE.local.md is listed in .gitignore.
PASS The lab-note has at least three words, and git ignores CLAUDE.local.md.
PASS start-04 Teach Claude a personal habit
You saved no guess for this lab.
Answer No. CLAUDE.local.md is gitignored, so the note stays on your machine and a clone never carries it.
What you just learned `AGENTS.md` is for the team and `CLAUDE.local.md` is for you. Private habits never belong in a shared file.

Next: start-02 Run the gate yourself. Run: make lab
```

After this, `git status --short` still printed nothing, which is the point: the new file never shows up as a change.

What to notice: the last line says `Next: start-02`. `make lab` points at the earliest lab that is not done, and start-02 was still red in the sandbox, so the map sent us back to it.

Trick to keep: use `>>` to append and check with `tail -1`. A single `>` replaces the whole file and silently drops your older notes.

The mistake people make: putting a personal habit in `AGENTS.md` because it is the file everyone knows. Your teammates then inherit it. Anything only you need goes in `CLAUDE.local.md`.

## Steps not run in the sandbox

- `make lab GUESS="..."`, the Predict step in each lab.
- `make lab HINT=1`, the hint reveals.
- `make lab WATCH=1`, the second-window watcher.
- A green `start-02` or `start-03`. Both ended red here, for the reasons given above.
- Reading the interactive Claude Code window. Every Claude call in this walkthrough was headless with `-p`.

## What the next lane builds on

The `daily` lane starts from three habits you now have: a command you run to know when work is done, a plan you read before any edit, and a private note that shapes Claude without touching shared files. The first daily lab is `daily-01`, "Continue where you left off", and its steps stop naming the command. You reveal each one with `make lab HINT=1`, so the lane assumes you can already run `make lab`, read a red proof and open a file under `.labs/work/` without help.
