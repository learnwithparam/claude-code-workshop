# Write the review rules

**Pairs with:** `docs/levels/verification.md`
**Help:** hinted

## Goal

Write a short `REVIEW.md` that tells a reviewer what to flag, each rule something a diff can fail.

## Steps

1. Read the real one: `cat REVIEW.md`.
2. Make the folder: `mkdir -p .labs/work`.
3. Write `.labs/work/REVIEW.md` with a heading and at least three bullets. Each bullet starts with "Flag" and names a concrete thing in a diff.
4. Try it on a diff: `claude -p "Review the staged changes using .labs/work/REVIEW.md"`.

## Proof

```sh
f=.labs/work/REVIEW.md
head -1 $f | grep -q '^# ' || exit 1
n=$(grep '^- Flag' $f | awk 'NF>=6' | sort -u | wc -l)
test "$n" -ge 3
```

## Hints

1. The first line is a `# ` heading. Then three or more lines starting with `- Flag`.
2. "Flag a default export outside web/src/pages/" can fail. "Write clean code" cannot.
3. Reuse the standards in `AGENTS.md` and turn each into a flag.
4. Commands, in order: `cat REVIEW.md`, `mkdir -p .labs/work`, `claude -p "Review the staged changes using .labs/work/REVIEW.md"`.

## What you just learned

A review rule is useful only if a diff can break it. Vague advice is noise.
