# Walkthrough: the daily lane, done live

You follow this by typing the same commands. Everything in a code block under "What I got" was captured by running that command in a cloud sandbox for this page. A step marked "not run in the sandbox" has no output here on purpose. Your ids and wording will differ.

The lab files are the source of truth: [continue a session](../../labs/daily/01-resume-a-session.md), [path-scoped rule](../../labs/daily/02-path-scoped-rule.md), [package a skill](../../labs/daily/03-first-skill.md), [block with a hook](../../labs/daily/04-first-hook.md). The command list for `make lab` is in the [labs README](README.md).

## The end result

When you finish you have files under `.labs/work/`, and each one is a different way to shape what Claude does next without retyping yourself:

- a saved session you resumed, so the context came back
- a rule that costs context only when Claude touches `api/`
- a skill Claude loads when the situation matches its description
- a hook that blocks an edit to the secrets file with exit code 2

Your work stays under `.labs/work/`, which git ignores, so no tracked file changes.

## Before you start

Window: shell, in the repo root.

```sh
make lab PATH_ID=pro
```

Choose the workshop once. The lane map then follows it. Each lab opens red on purpose, so run `make lab` first and read the failure before you do anything.

## daily-01: Continue where you left off

Pairs with [hand-built](../levels/hand-built.md).

**Type**

Window: shell, for every step.

```sh
make lab ID=daily-01
mkdir -p .labs/work
claude -p "Remember the word tangerine." --output-format json > .labs/work/session.json
claude -p --continue "What word did I ask you to remember?" > .labs/work/recall.md
cat .labs/work/recall.md
make lab ID=daily-01
```

**What I got**

The red run, trimmed to the proof lines:

```text
FAIL session.json holds a session_id.
grep: .labs/work/session.json: No such file or directory
FAIL recall.md holds the word tangerine.
grep: .labs/work/recall.md: No such file or directory
FAIL session.json is a real result with a session id, and recall.md holds the word.
```

`mkdir -p .labs/work` and the opening `claude -p` printed nothing to the screen. This printed the type and session id from `session.json`:

```text
result 82ccee9f-628f-5b58-a74f-25a745621b4d
```

The result text in that file is not pasted here. The output of `cat .labs/work/recall.md`:

```text
The word was **tangerine**. It comes from step 3 of the resume lab, `claude -p "Remember the word tangerine."`, which I ran in this sandbox. It returned a `session.json` with a `session_id`.

The follow-up `claude -p --continue "What word did I ask you to remember?"` was interrupted when the session ended. I don't know whether it finished or wrote `recall.md`. I haven't seen any `--continue` output, so I can't say what that call answered.

The walkthrough is also not written yet. So far I've only created the branch, run `npm ci` and run the first-lab commands. To finish, I'd check `.labs/work/recall.md`, run the remaining labs, write `docs/labs/walkthrough-daily.md`, run the prose check, then commit and push.
```

The proof after that:

```text
PASS session.json holds a session_id.
PASS recall.md holds the word tangerine.
PASS session.json is a real result with a session id, and recall.md holds the word.
PASS daily-01 Continue where you left off
```

**What to notice**

The session id is a plain uuid, and the second call never mentions it. `--continue` picks the most recent session in this folder. In this sandbox the most recent session was the one running this very task, so the answer talks about the walkthrough instead of giving a one-line reply. In your own folder the reply is a short sentence with the word in it, which is all the proof needs.

**Trick to keep**

`claude --continue` in the interactive app, or `/resume` to pick from a list, brings a task back instead of you re-explaining it. Use `claude -p` plus `--output-format json` when a script needs the session id.

**The mistake people make**

They run the second call from a different folder. `--continue` is per folder, so it opens nothing, or the wrong session. Stay in the same directory for both calls.

## daily-02: Write a rule that loads only where it applies

Pairs with [context](../levels/context.md).

**Type**

Window: shell for the commands, editor for the file.

```sh
make lab ID=daily-02
ls .claude/rules
cat .claude/rules/api.md
mkdir -p .labs/work/rules
```

Then in your editor create `.labs/work/rules/api-errors.md`, and in your shell run `make lab ID=daily-02` again.

**What I got**

The red run, trimmed:

```text
FAIL The rule file starts with a --- line.
head: cannot open '.labs/work/rules/api-errors.md' for reading: No such file or directory
FAIL The front matter has a paths: key.
grep: .labs/work/rules/api-errors.md: No such file or directory
FAIL The rule has at least two bullet lines.
grep: .labs/work/rules/api-errors.md: No such file or directory
sh: 1: test: Illegal number:
FAIL The rule file is well formed and its paths point at a folder that exists.
head: cannot open '.labs/work/rules/api-errors.md' for reading: No such file or directory
```

`ls .claude/rules`:

```text
api.md
secrets.md
shared.md
web.md
```

`cat .claude/rules/api.md`:

```text
---

paths:
- "api/**"

---

- The model name lives in `agent/model.ts` and nowhere else.
- Every route parses its body with zod before using it.
- A 500 sends a generic body. Log detail server-side only.
```

My earlier draft of `api-errors.md` copied that quoted glob, with a two space indent. The proof items before the last one passed and the last failed:

```text
PASS The rule file starts with a --- line.
PASS The front matter has a paths: key.
PASS The rule has at least two bullet lines.
FAIL The rule file is well formed and its paths point at a folder that exists.
```

I removed the quotes. The file that passed:

```text
---
paths:
  - api/**
---

- An error body sent to a customer never names the model, a token count or a stack trace.
- Every route returns the same generic message for a 500 and logs the detail server-side.
```

```text
PASS The rule file starts with a --- line.
PASS The front matter has a paths: key.
PASS The rule has at least two bullet lines.
PASS The rule file is well formed and its paths point at a folder that exists.
PASS daily-02 Write a rule that loads only where it applies
```

The last step, copying the file into `.claude/rules/` of your own project, is not run in the sandbox. This lab keeps its work out of tracked files.

**What to notice**

The shipped rule has its path in quotes and the proof wants it bare. The proof strips the folder name from the glob and tests that folder exists, and a leading quote makes `"api` a folder that does not exist. Read the failing item name, then compare your file with the one you copied from.

**Trick to keep**

Write each rule as a check that could fail: "an error to a customer never names the model". A rule you cannot fail is a wish. Scope it with `paths:` so it costs context only when Claude reads a matching file.

**The mistake people make**

They put the rule in `AGENTS.md` because it is easy to find. Then it loads on every task, including ones that never touch `api/`.

## daily-03: Package a habit as a skill

Pairs with [skills](../levels/skills.md).

**Type**

Window: shell for the commands, editor for the file.

```sh
make lab ID=daily-03
ls .claude/skills
head -12 .claude/skills/handoff/SKILL.md
mkdir -p .labs/work/skills/commit-message
```

Then in your editor create `.labs/work/skills/commit-message/SKILL.md`, and in your shell run `make lab ID=daily-03` again.

**What I got**

The red run, trimmed:

```text
FAIL SKILL.md has the name commit-message.
grep: .labs/work/skills/commit-message/SKILL.md: No such file or directory
FAIL The description starts with Use when.
grep: .labs/work/skills/commit-message/SKILL.md: No such file or directory
FAIL SKILL.md has at least eight non-empty lines.
grep: .labs/work/skills/commit-message/SKILL.md: No such file or directory
sh: 1: test: Illegal number:
FAIL The skill has a name, a Use when description and a body with real lines.
```

`ls .claude/skills`:

```text
factory-retro
frontend-ui-engineering
handoff
issue-triage
release-notes
spec-driven-development
test-driven-development
worksheet-bands
```

`head -12 .claude/skills/handoff/SKILL.md`:

```text
---

name: handoff
description: Write a handoff note so the next session can continue without this conversation. Use when stopping mid-task, before a long break or when context is nearly full.
---

1. State the goal in one sentence and what is done, verified by running it.
2. List the files changed and the one command that proves the current state, for example `make check-affected`.
3. Name the next step and any open decision a person must make.
4. Include failing output verbatim. Leave out exploration and anything that passed.
```

The skill I wrote:

```text
---
name: commit-message
description: Use when the user asks for a commit message or is about to commit staged changes
---

# Commit message

1. Read the staged diff with `git diff --staged`.
2. Write a subject line under 60 characters in the imperative mood.
3. Leave a blank line, then say why the change was made, not what each line does.
4. Mention the test that covers the change if there is one.
```

```text
PASS SKILL.md has the name commit-message.
PASS The description starts with Use when.
PASS SKILL.md has at least eight non-empty lines.
PASS The skill has a name, a Use when description and a body with real lines.
PASS daily-03 Package a habit as a skill
```

Whether Claude actually loads the skill in a live session is not run in the sandbox. The proof only checks the file.

**What to notice**

The `handoff` description carries two sentences: what it does, then "Use when" and the situations. The lab asks you to start with "Use when" and name the situation only. Claude matches the situation in front of it against that line before it opens the body.

**Trick to keep**

Name the trigger, not the topic. "Use when the user is about to commit staged changes" gets loaded at the right moment. "Commit message helper" does not say when.

**The mistake people make**

They put the good advice in the body and a vague label in the description. The body is read only after the description matches, so the advice never arrives.

## daily-04: Block a mistake with a hook

Pairs with [boundary](../levels/boundary.md).

**Type**

Window: shell for the commands, editor for the hook.

```sh
make lab ID=daily-04
cat .claude/hooks/pretooluse-file-guard.mjs
mkdir -p .labs/work/hooks
```

Then in your editor write `.labs/work/hooks/block-env.mjs`. Back in your shell, feed it both cases and run `make lab ID=daily-04`.

**What I got**

The red run, trimmed:

```text
FAIL The hook exits 2 when the file is the secrets file.
FAIL The hook exits 0 when the file is a.ts.
FAIL The hook blocks .env paths with a message and lets .env.example and a.ts through.
```

`cat .claude/hooks/pretooluse-file-guard.mjs`:

```text
// Files that change what every install or every run trusts need a person, not a model edit.
import { readFileSync } from "node:fs";
import { normalize } from "node:path";

// Case-insensitive and normalised, so ./A/../.GitHub/x cannot slip past. The runner re-checks the diff.
const PROTECTED =
  /(^|\/)(package-lock\.json|skills\.lock|\.github\/|\.claude\/hooks\/|\.claude\/settings[^/]*\.json)/i;

// The runner sets FACTORY_ALLOW_PROTECTED=1 only for an issue a person labelled factory:protected-ok.
export function guardFor(filePath, env) {
  if (
    env.FACTORY_ALLOW_PROTECTED === "1" ||
    !PROTECTED.test(normalize(filePath).replaceAll("\\", "/"))
  )
    return null;
  return `${filePath} is protected. Ask a person to change it, or have the issue labelled factory:protected-ok.`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = JSON.parse(readFileSync(0, "utf8"));
  const problem = guardFor(String(input.tool_input?.file_path ?? ""), process.env);
  if (problem) {
    console.error(problem);
    process.exit(2);
  }
}
```

The hook I wrote:

```text
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const path = String(input.tool_input?.file_path ?? "");

if (/(^|\/)\.env$/.test(path)) {
  console.error(`${path} is a secrets file. Ask a person to change it.`);
  process.exit(2);
}
process.exit(0);
```

Step 5 of the lab pipes a JSON line naming the secrets file into the hook and prints `$?`. That step is not run in the sandbox. This repo's own `pretooluse-secrets.mjs` hook refused the shell command because its text names the secrets file, with this message:

```text
Blocked: this file holds a secret. Load it inside a script, never in a shell command.
```

I did not work around it. The allowed case ran by hand, a `a.ts` path piped in and `$?` printed:

```text
0
```

The proof script runs the blocked cases for you, since `make lab` holds that text and not your shell:

```text
PASS The hook exits 2 when the file is the secrets file.
PASS The hook exits 0 when the file is a.ts.
PASS The hook blocks .env paths with a message and lets .env.example and a.ts through.
PASS daily-04 Block a mistake with a hook
```

The lane map afterwards:

```text
daily     ████████████████████ 4/4
  done daily-01  Continue where you left off
  done daily-02  Write a rule that loads only where it applies
  done daily-03  Package a habit as a skill
  done daily-04  Block a mistake with a hook
```

**What to notice**

You ran into a hook while writing a hook. The one in this repo reads the shell command text and blocks on a match, which is the same exit 2 mechanism you just built, applied to `Bash` instead of `Edit`. The file guard you read is the model for yours: read stdin, check one path, print to stderr, exit 2.

**Trick to keep**

Test a hook with both cases by hand, the blocked path and the allowed path, and read `$?` after each. A hook that only ever blocks is as broken as one that never does.

**The mistake people make**

They exit 1 on a bad path. Only exit code 2 blocks the call. Any other non-zero code is reported as an error and the action still goes through. They also forget `.env.example`: a hook that matches `.env` anywhere blocks the safe template too, and the proof checks that it passes.

## What the next lane builds on

The team lane takes each habit above and makes it shared and enforced. The hook you wrote is a single file on your machine. The next lane moves that idea into settings that deny reads for everyone ([deny secrets](../../labs/team/01-deny-secrets.md)), writes the review rules ([review rules](../../labs/team/02-review-rules.md)), keeps a receipt of a proof ([prove a level](../../labs/team/03-prove-a-level.md)), and packages your rule, skill and hook as a plugin ([plugin manifest](../../labs/team/04-plugin-manifest.md)). The ideas behind it are in [sharing](../levels/sharing.md) and [verification](../levels/verification.md).
