# Walkthrough: the team lane

You follow this by doing. Every command below was run in a cloud sandbox for this document, and the output is pasted as it came back. Your wording and versions will differ where the lab says so.

## What you will have at the end

A settings file that denies reading secrets, a `REVIEW.md` whose rules a diff can fail, a saved receipt that a level's proof passed, and a plugin folder that passes the strict validator. Together they turn what lives on your machine into things a whole team can share. The labs are [deny-secrets](../../labs/team/01-deny-secrets.md), [review-rules](../../labs/team/02-review-rules.md), [prove-a-level](../../labs/team/03-prove-a-level.md) and [plugin-manifest](../../labs/team/04-plugin-manifest.md). The lane map and the `make lab` commands are in the [labs README](README.md).

## Before you start

Use two windows: a shell at the repo root, and your editor. Where a step says Claude Code, it means `claude` run from that shell.

Run `npm ci` once. Then pick your workshop with `make lab PATH_ID=pro`.

In this sandbox no earlier lane was done, so plain `make lab` pointed at `start-01`. Every command below uses `ID=` to name the lab. On your own machine, after the earlier lanes, plain `make lab` lands on the right one.

## team-01: Deny what Claude must never read

Pairs with [boundary](../levels/boundary.md).

**Type**

1. In your shell, run the lab and read why it is red.
2. In your shell, read the real settings file.
3. In your shell, make the work folder.
4. In your editor, write `.labs/work/settings.json`.
5. In your shell, check the JSON parses.
6. In your shell, run the lab again.

```
$ make lab ID=team-01
FAIL settings.json denies reading the secrets file.
}

Node.js v22.23.4
FAIL settings.json denies reading the variant secrets files.
}

Node.js v22.23.4
FAIL Every deny entry is a real Tool(pattern) and none is a catch-all.
}

Node.js v22.23.4

RED, as expected team-01 this is the first run, so the proof fails on purpose.
The FAIL lines above are the state your steps will change. Do the steps, then run make lab again.
make: *** [Makefile:61: lab] Error 1
```

That is the tail of the output. Above it the lab prints the goal, a Predict question and the steps. Next, the real file:

```
$ cat .claude/settings.json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "deny": [
      "Read(**/.env*)",
      "Edit(**/.env*)",
      "Read(.factory/holdout/**)",
      "Bash(git push --force*)",
      "Bash(git push * --force*)",
      "Bash(git push * main*)",
      "Bash(git push * HEAD:main*)"
    ]
  },
  "sandbox": {
    "enabled": true,
    "filesystem": {
      "denyRead": ["**/.env*", ".factory/holdout/**"]
    }
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/pretooluse-secrets.mjs\""
          }
        ]
      },
      {
        "matcher": "Edit|Write|MultiEdit|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/pretooluse-file-guard.mjs\""
          },
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/pretooluse-test-lock.mjs\""
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/posttooluse-session-log.mjs\""
          }
        ]
      },
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/posttooluse-output-scan.mjs\""
          }
        ]
      },
      {
        "matcher": "Edit|Write|MultiEdit|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/posttooluse-format.mjs\""
          },
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/posttooluse-length-warn.mjs\""
          }
        ]
      },
      {
        "matcher": "Edit|Write|MultiEdit|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/posttooluse-typecheck.mjs\""
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/userpromptsubmit-route.mjs\""
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/sessionstart-integrity.mjs\""
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/stop-gate.mjs\""
          }
        ]
      }
    ]
  }
}
```

```
$ mkdir -p .labs/work
```

No output, as the lab says. In your editor, write `.labs/work/settings.json`:

```json
{
  "permissions": {
    "deny": ["Read(./.env)", "Read(./.env.*)"]
  }
}
```

Then the JSON check. It prints nothing when the file is valid:

```
$ node -e "JSON.parse(require('fs').readFileSync('.labs/work/settings.json','utf8'))"
```

To see what a failure looks like, I parsed a file with a missing comma:

```
<anonymous_script>:1
{ "permissions": { "deny": ["a" "b"] } }
                                ^

SyntaxError: Expected ',' or ']' after array element in JSON at position 32 (line 1 column 33)
    at JSON.parse (<anonymous>)
    at [eval]:1:6
    at runScriptInThisContext (node:internal/vm:209:10)
```

Now the lab again:

```
$ make lab ID=team-01
PASS settings.json denies reading the secrets file.
PASS settings.json denies reading the variant secrets files.
PASS Every deny entry is a real Tool(pattern) and none is a catch-all.
PASS team-01 Deny what Claude must never read
You saved no guess for this lab.
Answer Everyone who clones the repo, because the committed file travels with the code instead of living in one person's setup.
What you just learned `.claude/settings.json` is committed, so a deny rule protects the whole team, not only you.

Next: start-01 Ask Claude about the repo. Run: make lab
```

That is the tail again. The `Next:` line points at `start-01` only because this sandbox had no earlier progress.

**What to notice**

- The red run comes first on purpose. The `FAIL` lines are the list of what your work has to change.
- The real file has more than a deny list. The same paths also appear under `sandbox.filesystem.denyRead`, and a `PreToolUse` hook watches shell commands. Each layer covers the same risk a different way.
- The real patterns start with `**/`, so they reach nested folders. The lab's patterns start with `./`, so they name the repo root.

**Trick to keep**

Read the real file before you write yours, then compare. A rule you copy the shape of is a rule you already trust.

**The mistake people make here**

They write the file under `.labs/work/` and think the team is protected. That copy is practice. Only the committed `.claude/settings.json` travels with a clone.

A different trap showed up in this sandbox. I first tried to write the file with a shell heredoc that spelled out the deny rules. The secrets hook stopped the command:

```
PreToolUse:Bash hook error: [node "$CLAUDE_PROJECT_DIR/.claude/hooks/pretooluse-secrets.mjs"]: Blocked: this file holds a secret. Load it inside a script, never in a shell command.
```

The lab says to write this file in your editor, and that works. The hook is doing its job, so use the editor instead of reaching for a way round it.

## team-02: Write the review rules

Pairs with [verification](../levels/verification.md).

**Type**

1. In your shell, run the lab and read why it is red.
2. In your shell, read the real `REVIEW.md`.
3. In your shell, make the work folder (done in the previous lab, it is safe to repeat).
4. In your editor, write `.labs/work/REVIEW.md`.
5. In your shell, stage a small change, then ask headless Claude Code to review it with your rules.

```
$ cat REVIEW.md
# Review guidance

The reviewer reads this file first. It says what a failure looks like in this repo.

## Report format

- Start with the count: `2 important, 1 nit, 0 pre-existing`.
- Every finding names `file:line` and the input that breaks it. No evidence, no finding.
- At most 3 nits. Say nothing about style the formatter already fixes.

## Important

- A route, tool input or env read that skips its zod schema.
- Text shown to a customer that names a model, a token count or a stack trace.
- A worksheet that passes `checkBand` but overflows its page, or a band limit moved without the band table.
- A bug fix with no test that fails without it.
- A permission, hook or CI workflow change that widens what a run may do.

## Skip

- `supplied/`, `test-results/`, `docs/recordings/` and lockfiles.
- Existing problems the diff does not touch: label them pre-existing and stop.

## Rounds

Round one reads the whole diff. Later rounds read only what changed since the last round and never repeat a finding.
```

In your editor, write `.labs/work/REVIEW.md`. Each rule comes from `AGENTS.md` and starts with the word Flag:

```
# Team review rules

- Flag a default export outside web/src/pages/.
- Flag any route or env read that skips its zod schema.
- Flag a bug fix that ships without a test that fails without it.
- Flag customer-facing text that names a model or a stack trace.
```

Check the count of Flag lines, then stage a change that breaks one rule. I used a scratch file with a default export, and removed it after the run:

````
$ git add api/src/scratch-greet.ts
$ grep -c "^- Flag" .labs/work/REVIEW.md
4
$ claude -p "Review the staged changes using .labs/work/REVIEW.md"


The gate is still red. I couldn't fix it because both of my tool calls were blocked on permissions:

- **Edit:** the write to `api/src/scratch-greet.ts` wasn't granted.
- **Bash:** the compound lint, typecheck and vitest command needed approval.

Nothing has changed on disk. The failure is the default export on line 1 of `api/src/scratch-greet.ts`. Biome's `noDefaultExport` rule rejects it, and so does the AGENTS.md rule. The fix is this one-line change:

```ts
export function greet(name: string): string {
```

I found no imports of `greet`, so nothing else needs updating. After the edit I'd run `npm run lint`, `npm run typecheck -w api` and `npx vitest run api/`. The hook output only shows lint failing, so I haven't seen typecheck or vitest results.

Should I retry the edit? If you approve the write permission I'll apply it and run the gate. You could also unstage and delete the file, since it looks like scratch code.
````

That reply is not a review report, and it is not what the lab's Expect line describes. It reads as if a repo hook that checks the gate took over the turn. It did find the default export, which is the rule I broke, and it never cited `REVIEW.md` by name. Your run may differ, so read yours for whether it cites your rules.

Then the proof, first with the file missing, then with it written:

```
$ make lab ID=team-02
FAIL REVIEW.md has at least three lines starting with - Flag.
grep: .labs/work/REVIEW.md: No such file or directory
sh: 1: test: Illegal number:
FAIL REVIEW.md starts with a # title.
head: cannot open '.labs/work/REVIEW.md' for reading: No such file or directory
FAIL REVIEW.md has a title and three different, specific Flag lines.
head: cannot open '.labs/work/REVIEW.md' for reading: No such file or directory

RED, as expected team-02 this is the first run, so the proof fails on purpose.
The FAIL lines above are the state your steps will change. Do the steps, then run make lab again.
make: *** [Makefile:61: lab] Error 1
```

```
$ make lab ID=team-02
PASS REVIEW.md has at least three lines starting with - Flag.
PASS REVIEW.md starts with a # title.
PASS REVIEW.md has a title and three different, specific Flag lines.
PASS team-02 Write the review rules
You saved no guess for this lab.
Answer The second one. A reviewer can check it against a diff and say yes or no, while the first is opinion.
What you just learned A review rule is useful only if a diff can break it. Vague advice is noise.

Next: start-01 Ask Claude about the repo. Run: make lab
```

Both blocks are tails of the output.

**What to notice**

- The real `REVIEW.md` does more than list flags. It sets a report format, says what to skip and limits how many nits a reviewer may raise.
- The `Skip` section matters as much as the rules. It keeps a reviewer from spending effort on lockfiles and old problems.
- Staging a change that breaks one rule is the fastest way to test a rule. If the reviewer cannot find it, the rule is too vague.

**Trick to keep**

Write each rule so a diff answers yes or no. The proof enforces a floor: a Flag line must have enough words to name something specific, so a short slogan does not count.

**The mistake people make here**

They write taste: "write clean code", "keep functions small". A reviewer cannot fail a diff on taste, so it produces noise. Turn each line in `AGENTS.md` into a thing you can point at in a diff.

Also unstage the scratch change when you are done: `git rm --cached` on the file, then delete it. A forgotten staged file ends up in your next commit.

## team-03: Run a proof and keep the receipt

Pairs with [verification](../levels/verification.md) and, for the level it proves, [hand-built](../levels/hand-built.md).

**Type**

1. In your shell, run the lab and read why it is red.
2. In your shell, run the proof through `tee`.
3. In your shell, run the exercise view.
4. In your shell, run the lab again.

```
$ make lab ID=team-03
FAIL prove.txt has a line starting with PASS hand-built.
grep: .labs/work/prove.txt: No such file or directory
FAIL prove.txt holds the line make prove prints now.
grep: .labs/work/prove.txt: No such file or directory

RED, as expected team-03 this is the first run, so the proof fails on purpose.
The FAIL lines above are the state your steps will change. Do the steps, then run make lab again.
make: *** [Makefile:61: lab] Error 1
```

```
$ make prove LEVEL=hand-built | tee .labs/work/prove.txt
npm run prove -- hand-built

> claude-code-workshop@0.1.0 prove
> tsx scripts/prove/run.ts hand-built

PASS hand-built: every band renders, lints clean, and the app calls no API (7 bands ok)
```

```
$ make exercise LEVEL=hand-built TRACK=b
npx tsx scripts/exercise.ts hand-built b
PASS
```

```
$ make lab ID=team-03
PASS prove.txt has a line starting with PASS hand-built.
PASS prove.txt holds the line make prove prints now.
PASS team-03 Run a proof and keep the receipt
You saved no guess for this lab.
Answer A saved receipt. The output prints as it runs and also lands in a file you can show the team.
What you just learned A proof is a command with a verdict. Share the output, not a sentence saying it works.

Next: start-01 Ask Claude about the repo. Run: make lab
```

The last block is the tail again, and so is the red one above it.

**What to notice**

- `tee` prints and saves in one pass, so the receipt costs nothing extra.
- The verdict is a line starting `PASS hand-built:` and it names what was proven. A bare "ok" would tell a teammate nothing.
- The last proof item runs `make prove` again and compares its line with your file. A receipt has to match what the code does now.

**Trick to keep**

Run the exercise view with `TRACK=b` when you only want the failing line. Track `a` adds a hint. On a green level both print `PASS`.

**The mistake people make here**

They edit or paste the receipt by hand. The proof reruns the command and compares the line exactly, so an old or hand-made receipt goes red. If it prints `FAIL`, fix the claim it names, not the check.

## team-04: Package your setup as a plugin

Pairs with [sharing](../levels/sharing.md).

This lab copies a skill from an earlier lane. In this sandbox I wrote a small `commit-message` skill at `.labs/work/skills/commit-message/SKILL.md` the way the [first-skill lab](../../labs/daily/03-first-skill.md) asks, so there was something to package:

```
---
name: commit-message
description: Use when the user asks for a commit message or is about to commit staged changes
---

# Commit message

1. Read the staged diff with `git diff --cached`.
2. Write a subject under 60 characters in the imperative mood.
3. Add a body that says why the change was made, not what the lines are.
4. Leave out file lists, they are already in the diff.
```

**Type**

1. In your shell, run the lab and read why it is red.
2. In your shell, look at an existing plugin.
3. In your shell, make the plugin folders.
4. In your editor, write the manifest.
5. In your shell, copy the skill in.
6. In your shell, run the lab again, then run the strict validator.

```
$ make lab ID=team-04
PASS plugin.json has a name.
PASS plugin.json has a version like 0.1.0.
PASS plugin.json has a description.
FAIL The plugin name is kebab-case, the version is semver, the description has words and a skill exists.
ls: cannot access '.labs/work/plugin/skills/*/SKILL.md': No such file or directory

RED, as expected team-04 this is the first run, so the proof fails on purpose.
The FAIL lines above are the state your steps will change. Do the steps, then run make lab again.
make: *** [Makefile:61: lab] Error 1
```

That run happened after I wrote the manifest but before I copied the skill, which is why three items already pass. Your first run starts with all of them red.

```
$ ls plugins
factory-kit
factory-status
$ cat plugins/factory-kit/.claude-plugin/plugin.json
{
  "name": "factory-kit",
  "version": "1.0.1",
  "description": "The workshop factory as a plugin: triage, plan, build, review and verify agents, the retro and handoff skills, and a guard that keeps secrets out of shell commands.",
  "author": { "name": "learnwithparam" },
  "repository": "https://github.com/learnwithparam/claude-code-workshop",
  "license": "MIT"
}
$ mkdir -p .labs/work/plugin/.claude-plugin
```

In your editor, write `.labs/work/plugin/.claude-plugin/plugin.json`:

```json
{
  "name": "my-team-kit",
  "version": "0.1.0",
  "description": "Our team commit message skill, packaged so it installs in one command."
}
```

The lab says "copy your skill" without giving the command. This is what I ran:

```
$ cp -r .labs/work/skills .labs/work/plugin/skills
$ ls .labs/work/plugin/skills
commit-message
```

```
$ make lab ID=team-04
PASS plugin.json has a name.
PASS plugin.json has a version like 0.1.0.
PASS plugin.json has a description.
PASS The plugin name is kebab-case, the version is semver, the description has words and a skill exists.
PASS team-04 Package your setup as a plugin
```

That is where the lab stops. [sharing](../levels/sharing.md) names a stricter check, and it is worth a command of its own:

```
$ claude plugin validate .labs/work/plugin --strict
Validating plugin manifest: /home/user/claude-code-workshop/.labs/work/plugin/.claude-plugin/plugin.json

‼ Found 1 warning:

  > author: No author information provided. Consider adding author details for plugin attribution

Plugin directory checks for /home/user/claude-code-workshop/.labs/work/plugin. The plugin directory is the catalog that plugins are submitted to; this is a subset of what it runs.

× Found 1 problem the plugin directory refuses a submission for:

  > LICENSE: License missing (LICENSE_MISSING). This plugin has no LICENSE file and plugin.json has no `license`. The directory requires one of them.
    Fix: Add a LICENSE file to the plugin folder, or set `license` (an SPDX id) in plugin.json. A LICENSE at the repository root also counts for a plugin in a sub-folder.

‼ Found 1 plugin directory warning:

  > .claude-plugin/plugin.json icon: No icon (ICON_MISSING). No icon found in the plugin. The validator looked for `icon` in plugin.json and for a file at .claude-plugin/icon.png or .svg, assets/icon.png or .svg, or a similar path.
    Fix: Add a square PNG to the plugin folder at .claude-plugin/icon.png, or set `icon` in plugin.json to the path of a square PNG or JPEG in the plugin: 512 to 2048 px on each side, under 2 MB. SVG and WebP are not accepted. That file may become the listing icon only once: the first time the plugin is saved or submitted in the developer portal. Adding or changing it later does not change the icon.

About these checks:

  > The repository root was taken to be /home/user/claude-code-workshop, the nearest parent folder with a .git folder or file. README.md was taken from it, because this plugin folder has none of its own. No license file that counts (a regular file with one of the file names the plugin directory accepts) was found there either. For a plugin submitted from a git repository, the repository root is the top folder of that repository, with only what is committed there, so check that the folder named above is that top folder.

These plugin directory checks do not change the result below. To fail on problems the directory refuses a submission for, run this command with --profile directory.

The directory also runs a safety scan and a policy review that this command does not.

× Validation failed (--strict treats warnings as errors)
```

The exit status was 1.

I added `author` and `license` to the manifest:

```json
{
  "name": "my-team-kit",
  "version": "0.1.0",
  "description": "Our team commit message skill, packaged so it installs in one command.",
  "author": { "name": "My Team" },
  "license": "MIT"
}
```

```
$ claude plugin validate .labs/work/plugin --strict
Validating plugin manifest: /home/user/claude-code-workshop/.labs/work/plugin/.claude-plugin/plugin.json

Plugin directory checks for /home/user/claude-code-workshop/.labs/work/plugin. The plugin directory is the catalog that plugins are submitted to; this is a subset of what it runs.

‼ Found 1 plugin directory warning:

  > .claude-plugin/plugin.json icon: No icon (ICON_MISSING). No icon found in the plugin. The validator looked for `icon` in plugin.json and for a file at .claude-plugin/icon.png or .svg, assets/icon.png or .svg, or a similar path.
    Fix: Add a square PNG to the plugin folder at .claude-plugin/icon.png, or set `icon` in plugin.json to the path of a square PNG or JPEG in the plugin: 512 to 2048 px on each side, under 2 MB. SVG and WebP are not accepted. That file may become the listing icon only once: the first time the plugin is saved or submitted in the developer portal. Adding or changing it later does not change the icon.

About these checks:

  > The repository root was taken to be /home/user/claude-code-workshop, the nearest parent folder with a .git folder or file. README.md was taken from it, because this plugin folder has none of its own. For a plugin submitted from a git repository, the repository root is the top folder of that repository, with only what is committed there, so check that the folder named above is that top folder.

These plugin directory checks do not change the result below.

The directory also runs a safety scan and a policy review that this command does not.

√ Validation passed
```

I did not run the install commands from [sharing](../levels/sharing.md) (`claude plugin marketplace add` and `claude plugin install`): not run in the sandbox.

**What to notice**

- The lab proof passed before the strict validator did. Green in the lab means the manifest has the right shape, not that it is ready to publish.
- The strict validator printed a warning about a missing icon and still passed. Warnings under the directory checks do not change the result.
- The shipped `factory-kit` manifest carries `author`, `repository` and `license` as well. That is the shape to grow toward.

**Trick to keep**

Copy the shape of a plugin that already passes, then run `claude plugin validate <folder> --strict` after every edit. It names the exact field that is missing.

**The mistake people make here**

They stop when the lab goes green. A manifest with no `author` or `license` can pass the lab and still be refused by `--strict`. Another mistake is putting the skill anywhere but `skills/<name>/SKILL.md` inside the plugin folder. The proof looks for exactly that path.

## What the next lane builds on

You now have the pieces that make a setup shareable: a committed deny rule, review rules a diff can fail, a receipt from a proof, and a validated plugin. The `advanced` lane drops the steps and gives only the goal and the proof. It starts with [a read-only reviewer subagent](../../labs/advanced/01-reviewer-subagent.md), which reads a diff against the kind of rules you wrote in `REVIEW.md`. Later labs measure what a call costs, run work in a parallel worktree, write a check that walks the whole tree and check what a cloud session inherits. The last one builds on the committed settings you met here, since a cloud session starts from the same files a clone does. See [execution](../levels/execution.md) for the level these pair with.
