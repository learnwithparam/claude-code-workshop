# Continue where you left off

**Pairs with:** `docs/levels/hand-built.md`

## Goal

Start a session, leave it, and pick it up again with its context intact.

## Predict

Your second claude -p call uses --continue. If you left that flag out, would Claude know the word from the first call?

Answer: No. Each call starts with an empty context, so --continue is what reopens the saved session and brings the word back.

## Steps

1. Make the folder: `mkdir -p .labs/work`.
2. Start a session and save its metadata: `claude -p "Remember the word tangerine." --output-format json > .labs/work/session.json`.
3. Continue the same session: `claude -p --continue "What word did I ask you to remember?" > .labs/work/recall.md`.
4. Read the answer: `cat .labs/work/recall.md`.

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
