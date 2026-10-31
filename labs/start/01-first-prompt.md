# Ask Claude about the repo

**Pairs with:** `docs/levels/hand-built.md`

## Goal

Run Claude Code once, headless, and keep its answer in a file you can read.

## Steps

1. Check your machine: `make doctor`.
2. Make the lab work folder: `mkdir -p .labs/work`.
3. Ask a question and save the answer: `claude -p "In five bullets, what does this repo do?" > .labs/work/repo-tour.md`.
4. Read it: `cat .labs/work/repo-tour.md`.

## Proof

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
