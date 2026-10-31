# Ask Claude about the repo

**Pairs with:** `docs/levels/hand-built.md`
**Help:** guided

## Goal

Run Claude Code once, headless, and keep its answer in a file you can read. The answer names a real folder of this repo.

## Predict

When you run claude with -p and a redirect to a file, what do you see in the terminal and what lands in the file?

Answer: Nothing prints and the answer lands in the file, because -p writes one answer to standard output and the redirect captures it.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Check your machine: `make doctor`.
   Expect: Lines starting `ok`, such as `ok node` and a `claude` version number. A line starting `warn:` names what to install first. Versions will differ.
3. Make the lab work folder: `mkdir -p .labs/work`.
   Expect: No output. The folder `.labs/work` now exists.
4. Ask a question and save the answer: `claude -p "In five bullets, what does this repo do?" > .labs/work/repo-tour.md`.
   Expect: No output on screen. It may take several seconds, and the answer goes to `repo-tour.md`.
5. Read it: `cat .labs/work/repo-tour.md`.
   Expect: About five bullets describing the repo, with words like worksheet, grade band or Claude. The wording will differ.

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
