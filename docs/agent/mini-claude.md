# Mini Claude Code: three tools, a deny rule and a hook

**Track:** build the agent. **Proof:** `npx vitest run lab`.

## Goal

Write the smallest coding agent that edits files and runs commands, and see which parts of Claude Code are only rules around that loop.

## The problem

The manual loop runs one tool that checks a worksheet. A coding agent needs to touch your disk and your shell. The moment it can do that, the rules around the loop matter more than the loop.

## Without

Give the model `bash` and nothing else. It can run `cat .env` and put your key into the chat. Nothing stops it, and nothing logs that it tried.

## The code

`lab/mini-claude/mini-claude.ts` is about 70 lines:

- `read_file`, `edit_file` and `bash` are the three tools. An edit succeeds only when the old text appears exactly once.
- `denied` runs before every call. It refuses `.env` files for the file tools and for any `bash` command that names one. The model's wording never reaches it.
- A `Hook` is a function that sees a call and returns a reason to veto it. It does what a PreToolUse hook does in `.claude/settings.json`.
- `mini` is the loop. The model is a function from the chat to the next turn, so a test can script it. `maxTurns` ends a loop that never finishes.

## With

The same ask, "show me the key", now ends with a `blocked` entry in the log, and the model's chat never contains the secret.

## Run it

1. Open `lab/mini-claude/mini-claude.test.ts`. Find `script`: a model that plays back calls one turn at a time.
2. Type `npx vitest run lab`. Expect 5 passed.
3. In `mini-claude.ts`, change `call.name !== "bash" &&` in `denied` to `false &&` and run it again. Expect the `.env` read test to fail. Change it back.

## Prove it

The tests assert five things: an edit lands on disk, a `.env` read is blocked, a `bash` command that names `.env` is blocked, a hook can veto an allowed call, and the loop stops at its turn limit. Two of them also assert the secret text never appears in anything the model was shown.

## Exercise

Track A: add a hook that blocks `bash` commands containing `git push`, and a test for it. Track B: make `denied` read a list of globs from a file, the way `.claude/settings.json` lists deny rules.

## Discussion

This deny rule matches names in a command string. A command like `cat $(echo .e)nv` slips past. What does Claude Code do that a string match cannot, and where does a sandbox belong?
