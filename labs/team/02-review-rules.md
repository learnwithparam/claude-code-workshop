# Write the review rules

**Pairs with:** `docs/levels/verification.md`

## Goal

Write a short `REVIEW.md` that tells a reviewer what to flag, each rule something a diff can fail.

## Steps

1. Read the real one: `cat REVIEW.md`.
   Expect: A heading, then short bullets, each starting with a flag word and naming something a diff can break.
2. Make the folder: `mkdir -p .labs/work`.
   Expect: No output. The folder `.labs/work` now exists.
3. Write `.labs/work/REVIEW.md` with a heading and at least three bullets. Each bullet starts with "Flag" and names a concrete thing in a diff.
   Expect: No output from a command, since you are writing the file. Afterwards `grep -c '^- Flag' .labs/work/REVIEW.md` prints `3` or more.
4. Try it on a diff: `claude -p "Review the staged changes using .labs/work/REVIEW.md"`.
   Expect: A short review that cites your rules. With nothing staged it says there is nothing to review, so stage a small change first. The wording will differ.

## Proof

```sh
test "$(grep -c '^- Flag' .labs/work/REVIEW.md)" -ge 3 && head -1 .labs/work/REVIEW.md | grep -q '^# '
```

## Hints

1. The first line is a `# ` heading. Then three or more lines starting with `- Flag`.
2. "Flag a default export outside web/src/pages/" can fail. "Write clean code" cannot.
3. Reuse the standards in `AGENTS.md` and turn each into a flag.

## What you just learned

A review rule is useful only if a diff can break it. Vague advice is noise.
