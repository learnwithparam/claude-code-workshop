# Ask Claude about the repo

**Pairs with:** `docs/levels/hand-built.md`
**Help:** guided

## Goal

Run Claude Code once, headless, and keep its answer in a file you can read.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
2. Check your machine: `make doctor`.
3. Make the lab work folder: `mkdir -p .labs/work`.
4. Ask a question and save the answer: `claude -p "In five bullets, what does this repo do?" > .labs/work/repo-tour.md`.
5. Read it: `cat .labs/work/repo-tour.md`.

## Proof

1. repo-tour.md has at least three non-empty lines.

   ```sh
   test "$(grep -c . .labs/work/repo-tour.md)" -ge 3
   ```

## Hints

1. The proof reads `.labs/work/repo-tour.md`. Does the file exist?
2. `-p` prints one answer and exits, so `>` can capture it.
3. If `claude` is not found, install it from the official docs, then run `make doctor` again.

## What you just learned

`claude -p` is Claude Code as a command: a question in, an answer out, no chat window.
