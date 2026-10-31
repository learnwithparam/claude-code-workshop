# Continue where you left off

**Pairs with:** `docs/levels/hand-built.md`
**Help:** hinted

## Goal

Start a session, leave it, and pick it up again with its context intact.

## Steps

1. Make the folder: `mkdir -p .labs/work`.
2. Start a session and save its metadata: `claude -p "Remember the word tangerine." --output-format json > .labs/work/session.json`.
3. Continue the same session: `claude -p --continue "What word did I ask you to remember?" > .labs/work/recall.md`.
4. Read the answer: `cat .labs/work/recall.md`.

## Proof

```sh
node -e "const s=require('./.labs/work/session.json'); process.exit(s.type==='result' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(s.session_id) ? 0 : 1)" && grep -qi 'tangerine' .labs/work/recall.md
```

## Hints

1. Two files must exist: `.labs/work/session.json` and `.labs/work/recall.md`.
2. `--continue` reopens the most recent session in this folder.
3. In the interactive app the same move is `claude --continue`, or `/resume` to choose from a list.
4. Commands, in order: `mkdir -p .labs/work`, `claude -p "Remember the word tangerine." --output-format json > .labs/work/session.json`, `claude -p --continue "What word did I ask you to remember?" > .labs/work/recall.md`, `cat .labs/work/recall.md`.

## What you just learned

A session is a saved conversation. Resume it instead of re-explaining the task.
