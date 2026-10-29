# Elective: Status line

**Extends:** context. **Proof:** `make check` runs `tests/structure/status-line.test.ts`.

## Goal

You cannot see which model or how much spend a session has without asking.

## The problem

You cannot see which model or how much spend a session has without asking.

## Without

Run a long session and ask Claude what it has cost so far. It cannot always say, and you stop to ask.

## The config

- `.claude/statusline.mjs` reads the session JSON on stdin and prints one line: the model name and the session cost.
- Claude Code runs it when `statusLine` in a settings file is `{ "type": "command", "command": "node .claude/statusline.mjs" }`. Add it to `.claude/settings.local.json` so it stays yours.

## With

Add the `statusLine` entry to `.claude/settings.local.json` and start a session. The bottom line shows the model and the cost, updated as you work.

## Run it

1. Add the `statusLine` entry to `.claude/settings.local.json`.
2. Type `claude` and send one prompt.
3. Expect a line such as `Haiku 5.5 | $0.01` under the prompt.

## Prove it

A unit test feeds the script a session payload and asserts the line, and a payload with missing fields still prints a safe default.

## Exercise

Track A: show the working folder name too. Track B: print the cost in red above a limit you choose.

## Discussion

Which number do you glance at most while working, and is it on screen?
