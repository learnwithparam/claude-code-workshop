# Ask Claude about the repo

**Pairs with:** `docs/levels/hand-built.md`
**Help:** guided

## Goal

Run Claude Code once, headless, and keep its answer in a file you can read.

## Steps

1. Check your machine: `make doctor`.
   Expect: Lines starting `ok`, such as `ok node` and a `claude` version number. A line starting `warn:` names what to install first. Versions will differ.
2. Make the lab work folder: `mkdir -p .labs/work`.
   Expect: No output. The folder `.labs/work` now exists.
3. Ask a question and save the answer: `claude -p "In five bullets, what does this repo do?" > .labs/work/repo-tour.md`.
   Expect: No output on screen. It may take several seconds, and the answer goes to `repo-tour.md`.
4. Read it: `cat .labs/work/repo-tour.md`.
   Expect: About five bullets describing the repo, with words like worksheet, grade band or Claude. The wording will differ.

## Proof

```sh
test "$(grep -c . .labs/work/repo-tour.md)" -ge 3
```

## Hints

1. The proof reads `.labs/work/repo-tour.md`. Does the file exist?
2. `-p` prints one answer and exits, so `>` can capture it.
3. If `claude` is not found, install it from the official docs, then run `make doctor` again.

## What you just learned

`claude -p` is Claude Code as a command: a question in, an answer out, no chat window.
