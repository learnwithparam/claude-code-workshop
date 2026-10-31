# Ask Claude about the repo

**Pairs with:** `docs/levels/hand-built.md`
**Help:** guided

## Goal

Run Claude Code once, headless, and keep its answer in a file you can read. The answer names a real folder of this repo.

## Steps

1. Check your machine: `make doctor`.
2. Make the lab work folder: `mkdir -p .labs/work`.
3. Ask a question and save the answer: `claude -p "In five bullets, what does this repo do?" > .labs/work/repo-tour.md`.
4. Read it: `cat .labs/work/repo-tour.md`.

## Proof

1. repo-tour.md has at least three non-empty lines.

   ```sh
   test "$(grep -c . .labs/work/repo-tour.md)" -ge 3
   ```
2. repo-tour.md has three lines and names a folder of this repo.

   ```sh
   f=.labs/work/repo-tour.md
   test "$(grep -c . $f)" -ge 3 || exit 1
   for d in $(ls -d */ | tr -d / | grep -v node_modules); do grep -qw -- "$d" $f && exit 0; done
   exit 1
   ```

## Hints

1. The proof reads `.labs/work/repo-tour.md`. Does the file exist, and does it name a real top-level folder?
2. `-p` prints one answer and exits, so `>` can capture it.
3. If `claude` is not found, install it from the official docs, then run `make doctor` again.

## What you just learned

`claude -p` is Claude Code as a command: a question in, an answer out, no chat window.
