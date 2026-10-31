# Continue where you left off

**Pairs with:** `docs/levels/hand-built.md`
**Help:** hinted

## Warm-up

Which file holds your private habits, `AGENTS.md` or `CLAUDE.local.md`?
From: start-04
Answer: `CLAUDE.local.md`. `AGENTS.md` is shared with the whole team.

## Goal

Start a session, leave it, and pick it up again with its context intact.

## Predict

Your second claude -p call uses --continue. If you left that flag out, would Claude know the word from the first call?

Answer: No. Each call starts with an empty context, so --continue is what reopens the saved session and brings the word back.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Make the folder: `mkdir -p .labs/work`.
   Expect: No output. The folder `.labs/work` now exists.
3. Start a session and save its metadata: `claude -p "Remember the word tangerine." --output-format json > .labs/work/session.json`.
   Expect: No output on screen. `session.json` holds one JSON object with a `session_id` field. The id will differ every time.
4. Continue the same session: `claude -p --continue "What word did I ask you to remember?" > .labs/work/recall.md`.
   Expect: No output on screen. The answer goes to `recall.md`.
5. Read the answer: `cat .labs/work/recall.md`.
   Expect: A short sentence that mentions tangerine. The wording will differ.

## Proof

1. session.json holds a session_id.

   ```sh
   grep -q 'session_id' .labs/work/session.json
   ```
2. recall.md holds the word tangerine.

   ```sh
   grep -qi 'tangerine' .labs/work/recall.md
   ```

## Hints

1. Two files must exist: `.labs/work/session.json` and `.labs/work/recall.md`.
2. `--continue` reopens the most recent session in this folder.
3. In the interactive app the same move is `claude --continue`, or `/resume` to choose from a list.
4. Commands, in order: `mkdir -p .labs/work`, `claude -p "Remember the word tangerine." --output-format json > .labs/work/session.json`, `claude -p --continue "What word did I ask you to remember?" > .labs/work/recall.md`, `cat .labs/work/recall.md`.

## What you just learned

A session is a saved conversation. Resume it instead of re-explaining the task.
