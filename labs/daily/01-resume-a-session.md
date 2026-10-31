# Continue where you left off

**Pairs with:** `docs/levels/hand-built.md`

## Goal

Start a session, leave it, and pick it up again with its context intact.

## Steps

1. Make the folder: `mkdir -p .labs/work`.
   Expect: No output. The folder `.labs/work` now exists.
2. Start a session and save its metadata: `claude -p "Remember the word tangerine." --output-format json > .labs/work/session.json`.
   Expect: No output on screen. `session.json` holds one JSON object with a `session_id` field. The id will differ every time.
3. Continue the same session: `claude -p --continue "What word did I ask you to remember?" > .labs/work/recall.md`.
   Expect: No output on screen. The answer goes to `recall.md`.
4. Read the answer: `cat .labs/work/recall.md`.
   Expect: A short sentence that mentions tangerine. The wording will differ.

## Proof

```sh
grep -q 'session_id' .labs/work/session.json && grep -qi 'tangerine' .labs/work/recall.md
```

## Hints

1. Two files must exist: `.labs/work/session.json` and `.labs/work/recall.md`.
2. `--continue` reopens the most recent session in this folder.
3. In the interactive app the same move is `claude --continue`, or `/resume` to choose from a list.

## What you just learned

A session is a saved conversation. Resume it instead of re-explaining the task.
