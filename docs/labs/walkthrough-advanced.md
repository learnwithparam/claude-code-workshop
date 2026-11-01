# Walkthrough: the advanced lane, live

You type, the sandbox output sits beside it, and each lab hands you one trick. Output below was captured by running the same commands in a cloud sandbox on this repo. A step marked "not run in the sandbox" has no output on purpose. Your numbers (cost, hashes, session ids) will differ.

## What you will have at the end

- A read-only reviewer subagent that cannot edit a file.
- A headless Claude call whose cost you read from its own JSON.
- A second checkout on its own branch, so two sessions never share files.
- A script that walks a whole tree, proven to go red on a planted bad file.
- A saved copy of the guardrails a cloud session inherits, and a feel for how fast that copy goes stale.

Setup, once, in your shell: `make lab PATH_ID=pro`. Every lab in this lane is goal only, so the brief gives the goal and the proof and the hints stay hidden until you ask. Lab files: [advanced-01](../../labs/advanced/01-reviewer-subagent.md), [advanced-02](../../labs/advanced/02-measure-a-call.md), [advanced-03](../../labs/advanced/03-parallel-worktree.md), [advanced-04](../../labs/advanced/04-structural-check.md), [advanced-05](../../labs/advanced/05-cloud-session-guardrails.md). The lane map is in the [labs README](README.md).

## advanced-01: a read-only reviewer subagent

Pairs with [execution](../levels/execution.md).

**Type, in your shell.** Start red so you know what you are changing:

```
make lab ID=advanced-01
```

Output, with the work folder still empty (the proof lines are the part that matters):

```
FAIL The agent file has the name reviewer.
grep: .labs/work/agents/reviewer.md: No such file or directory
FAIL The agent file has a description.
grep: .labs/work/agents/reviewer.md: No such file or directory
FAIL The tools line lists exactly Read, Grep, Glob.
grep: .labs/work/agents/reviewer.md: No such file or directory
FAIL The agent file names a model.
grep: .labs/work/agents/reviewer.md: No such file or directory
FAIL No tool that writes or runs commands (Write, Edit, Bash) is listed.
FAIL The file opens with front matter, has a four word description, a model name and a prompt body.
sed: can't read .labs/work/agents/reviewer.md: No such file or directory

RED, as expected advanced-01 this is the first run, so the proof fails on purpose.
The FAIL lines above are the state your steps will change. Do the steps, then run make lab again.
make: *** [Makefile:61: lab] Error 1
```

**Type, in your shell.** Read a real subagent from this repo, then make the folder:

```
ls .claude/agents
head -9 .claude/agents/reviewer.md
mkdir -p .labs/work/agents
```

```
builder.md
design-reviewer.md
planner.md
reviewer.md
security-reviewer.md
test-reviewer.md
verifier.md
---

name: reviewer
description: Reviews a change for blocking problems and ends with a verdict. Use after build.
model: sonnet
memory: project
maxTurns: 15
tools: Read, Grep, Glob, Bash
---
```

**Type, in your editor.** Write `.labs/work/agents/reviewer.md`:

```
---
name: reviewer
description: Reads a diff and reports blocking problems only.
tools: Read, Grep, Glob
model: haiku
---
You review a change. Read the files, search the tree, and end with a verdict: approve or block.
List each blocking problem with its file and line. You cannot edit, so report and stop.
```

**Type, in your shell.** `make lab ID=advanced-01`

```
PASS The agent file has the name reviewer.
PASS The agent file has a description.
PASS The tools line lists exactly Read, Grep, Glob.
PASS The agent file names a model.
PASS No tool that writes or runs commands (Write, Edit, Bash) is listed.
PASS The file opens with front matter, has a four word description, a model name and a prompt body.
PASS advanced-01 Write a read-only reviewer subagent
You saved no guess for this lab.
Answer No. Without Write or Edit it has no way to change a file, so its report is the only thing it can produce.
What you just learned The tools list is the fence. A reviewer without Write cannot fix things quietly, so its report is the whole truth.

Next: start-01 Ask Claude about the repo. Run: make lab
```

**Notice.** The repo's own reviewer lists `Bash` in its tools, and the lab's proof rejects that line. The lab reviewer is stricter than the one the repo ships, because Bash can write files through a redirect.

**Trick to keep.** Save your guess before you start with `make lab GUESS="..."`. On a pass you see it beside the answer, which turns the lab into a prediction you can score.

**Mistake people make.** Copying the repo's reviewer and leaving `Bash` in the tools line, or putting `tools:` as a YAML list. The proof wants the exact line `tools: Read, Grep, Glob`.

## advanced-02: what a call costs

Pairs with [agent SDK](../agent/agent-sdk.md).

**Type, in your shell.** Make the folder, then one headless call capped at two turns:

```
mkdir -p .labs/work
claude -p "List the folders in this repo." --max-turns 2 --output-format json > .labs/work/call.json
```

The call prints nothing to the screen because the JSON goes to the file. The only thing on stderr in this sandbox was a warning that the sandbox feature lacked its dependencies:

```
⚠ Sandbox disabled: sandbox is enabled but dependencies are missing: bubblewrap (bwrap) not installed, socat not installed · install missing tools (e.g. apt install bubblewrap socat) or see https://code.claude.com/docs/en/sandboxing
  Commands will run WITHOUT sandboxing. Network and filesystem restrictions will NOT be enforced.
```

**Type, in your shell.** Read the cost out of the file, then save exactly that number:

```
node -e "console.log(require('./.labs/work/call.json').total_cost_usd)"
node -e "console.log(require('./.labs/work/call.json').total_cost_usd)" > .labs/work/cost.txt
node -e "const j=require('./.labs/work/call.json');console.log(j.type,j.num_turns,j.is_error)"
```

```
0.0594344
result 2 false
```

**Type, in your shell.** `make lab ID=advanced-02`

```
PASS call.json records total_cost_usd.
PASS cost.txt holds one plain number.
PASS call.json is a real result and cost.txt holds exactly its total_cost_usd.
PASS advanced-02 Measure what a call costs
You saved no guess for this lab.
Answer In the call's own JSON output, as a total_cost_usd field, so you can read the number right after the call.
What you just learned Cost is a field in the output, not a surprise on the invoice. Cap the turns and read the number.

Next: start-01 Ask Claude about the repo. Run: make lab
```

**Notice.** The number came from the call's own output, with no invoice involved. The same JSON holds `usage`, `duration_api_ms` and `stop_reason`, so one file answers what it cost, how long it took and why it stopped.

**Trick to keep.** Never type the cost. Print it from the file with `node -e` and redirect that into `cost.txt`. The proof compares the two for exact equality, and so will anyone auditing you later.

**Mistake people make.** Running the call without `--output-format json`, which gives plain text and no cost field. The other one is rerunning the call after you saved the cost, which overwrites `call.json` with a new number and breaks the match.

## advanced-03: a parallel worktree

Pairs with [agent teams](../electives/agent-teams.md).

**Type, in your shell, from the repo root.** Add the worktree on a new branch, list worktrees, and look at the `.git` file inside it:

```
git worktree add .labs/work/wt -b lab/parallel
git worktree list
cat .labs/work/wt/.git
```

```
Preparing worktree (new branch 'lab/parallel')
HEAD is now at caba5f9 Let cloud sessions push their own branches; main and force-push stay denied
/home/user/claude-code-workshop                caba5f9 [cloud/walkthrough-advanced]
/home/user/claude-code-workshop/.labs/work/wt  caba5f9 [lab/parallel]
gitdir: /home/user/claude-code-workshop/.git/worktrees/wt
```

**Try the mistake on purpose.** Add a second worktree with the same new branch name:

```
git worktree add .labs/work/wt2 -b lab/parallel
```

```
Preparing worktree (new branch 'lab/parallel')
fatal: a branch named 'lab/parallel' already exists
```

**Type, in Claude Code.** `cd .labs/work/wt && claude`, ask it anything, then leave. Not run in the sandbox, because a nested interactive session needs a terminal.

**Type, in your shell, from the repo root, while the worktree still exists.** `make lab ID=advanced-03`

```
PASS The worktree folder has a .git file.
PASS That .git file points at a gitdir.
PASS The worktree belongs to this repo and sits on the branch lab/parallel.
PASS advanced-03 Work in a parallel worktree
You saved no guess for this lab.
Answer No. Git allows a branch in only one worktree, so the second worktree needs its own new branch.
What you just learned Parallel work needs separate working folders. Two sessions in one folder overwrite each other.

Next: start-01 Ask Claude about the repo. Run: make lab
```

Then clean up, and delete the branch so you can redo the lab:

```
git worktree remove .labs/work/wt
git branch -D lab/parallel
git worktree list
```

```
Deleted branch lab/parallel (was caba5f9).
/home/user/claude-code-workshop  caba5f9 [cloud/walkthrough-advanced]
```

**Notice.** A worktree's `.git` is a file that points back into the main repo's `.git/worktrees/`. Both checkouts share history and branches but not working files.

**Trick to keep.** Make the branch and the folder in one command with `-b`. The branch name tells you at a glance which session owns which folder.

**Mistake people make.** Running `make lab` after removing the worktree, so the proof cannot see it. The other is removing the worktree and forgetting the branch, so the next `-b lab/parallel` fails as shown above.

## advanced-04: a check that walks the whole tree

Pairs with [workflows](../levels/workflows.md).

**Type, in your shell.** Read the repo's own convention checker first: `cat scripts/check-conventions.ts`. Output not pasted here, since the file is longer than this page needs. Then make the folder: `mkdir -p .labs/work`.

**Type, in your editor.** Write `.labs/work/check-kebab.mjs`:

```js
import { readdirSync } from "node:fs";

const root = process.argv[2] ?? ".";
const bad = readdirSync(root, { recursive: true }).filter(
  (p) => !/^[a-z0-9.-]+$/.test(String(p).split("/").at(-1)),
);
for (const p of bad) console.log(p);
if (bad.length > 0) process.exitCode = 1;
```

**Type, in your shell.** Run it on a folder that follows the rule, on `docs` (which does not), and on a planted bad file:

```
node .labs/work/check-kebab.mjs docs/levels; echo $?
node .labs/work/check-kebab.mjs docs; echo $?
mkdir -p .labs/work/bad && touch .labs/work/bad/BadName.txt
node .labs/work/check-kebab.mjs .labs/work/bad; echo $?
```

```
0
README.md
examples/CLAUDE.local.md
labs/README.md
1
BadName.txt
1
```

Remove the planted folder with `rm -rf .labs/work/bad`, then `make lab ID=advanced-04`:

```
PASS check-kebab.mjs passes on a folder of kebab-case names.
PASS check-kebab.mjs fails on a folder that holds BadName.txt.
PASS check-kebab.mjs passes a good tree, then fails a bad one and a nested one and names the offender.
PASS advanced-04 Write a check that walks the whole tree
You saved no guess for this lab.
Answer You cannot tell until you plant a bad file. Seeing it exit 1 on that file is what proves the check can catch a mistake.
What you just learned One script that walks every file beats a reviewer's memory. Prove it by planting a bad file and watching it go red.

Next: start-01 Ask Claude about the repo. Run: make lab
```

**Notice.** `docs` fails on `README.md`, which the lab calls out as a name your check rightly flags: capital letters are outside the rule. A red result on real files is the check doing its job, so read the offender list before you decide the check is wrong.

**Trick to keep.** After every new check, plant one bad file and watch the exit code turn to 1. A check that has never failed has not been shown to work.

**Mistake people make.** Testing the whole relative path against the pattern, so `sub-dir/a.txt` fails on the slash. Test the last segment only. The other is printing offenders but forgetting `process.exitCode = 1`, which leaves the check green.

## advanced-05: the guardrails a cloud session inherits

Pairs with [cloud sessions](../factory/f11-cloud-sessions.md).

**Type, in your shell.** Make the folder, then run the command from the section "What a cloud session reads from the repo" and save it:

```
mkdir -p .labs/work
node -e 'const s=require("./.claude/settings.json");console.log(s.permissions.deny);console.log(Object.keys(s.hooks))' > .labs/work/cloud-guards.txt
cat .labs/work/cloud-guards.txt
```

```
[
  'Read(**/.env*)',
  'Edit(**/.env*)',
  'Read(.factory/holdout/**)',
  'Bash(git push --force*)',
  'Bash(git push * --force*)',
  'Bash(git push * main*)',
  'Bash(git push * HEAD:main*)'
]
[
  'PreToolUse',
  'PostToolUse',
  'UserPromptSubmit',
  'SessionStart',
  'Stop'
]
```

**Type, in your editor.** Write `.labs/work/push-route.md` with a route and a reason on separate lines. What I wrote:

```
Route: a person ships.
A push is the step that needs a human, and the deny rules still block main and force pushes.
```

**Type, in Claude Code.** Optional: `claude --cloud`, then ask it to run a push. Not run in the sandbox, because it needs a claude.ai login.

**Type, in your shell.** `make lab ID=advanced-05`

```
PASS cloud-guards.txt matches the deny list and hook names that `.claude/settings.json` holds now.
FAIL cloud-guards.txt lists the push deny and the PreToolUse hook.
PASS push-route.md gives a route and a reason on separate lines.
FAIL The saved files match the repo now, and push-route.md names a route with a reason.

RED, as expected advanced-05 this is the first run, so the proof fails on purpose.
The FAIL lines above are the state your steps will change. Do the steps, then run make lab again.
make: *** [Makefile:61: lab] Error 1
```

**Notice.** This lab stayed red in the sandbox, and the cause is not your work. The latest commit narrowed the deny list from `Bash(git push *)` to rules that block force pushes and pushes to main, so a cloud session may now push its own branch. Proof item 2 still searches for the old literal `Bash(git push *)`, and the lab's Predict answer ("the push is denied") describes the old settings. I did not edit the lab or the settings, since this page is the only file I may change. If you hit the same red, the saved file is correct and the lab is out of date. Report it with the feedback link the lab prints.

**Trick to keep.** Regenerate your saved guardrails file after any change to `.claude/settings.json`. The first proof item diffs the file against the live settings, which is why it passed here and would have gone red had the file been saved before the last commit.

**Mistake people make.** Treating a deny list as a closed door. Read the patterns: `Bash(git push * main*)` blocks a push naming main and leaves a push to another branch alone.

## Where to go after this lane

- Run the factory against a real ticket: [F1 Plan](../factory/f1-plan.md) starts the stages that use the reviewer you wrote.
- Package what you built so a team gets it: [sharing](../levels/sharing.md).
- Prove changes with receipts instead of claims: [verification](../levels/verification.md).
- Pick your next lab with `make next`, or see the whole map with `make progress`.
