# Write a check that walks the whole tree

**Pairs with:** `docs/levels/workflows.md`
**Help:** goal

## Goal

Write .labs/work/check-kebab.mjs: given a folder, it walks it, prints each file whose name is not lowercase with dashes and dots, and exits 1 if any. Prove it passes on docs and fails on a bad tree. The proof below must pass.

## Steps

1. Read an existing check in this repo.
2. Make the lab work folder.
3. Write the walker and the name rule, printing every offender.
4. Run it on the docs folder and look at the exit code.

## Proof

```sh
s=.labs/work/check-kebab.mjs
node $s docs >/dev/null 2>&1 || exit 1
mkdir -p .labs/work/bad && : > .labs/work/bad/BadName.txt
node $s .labs/work/bad >/dev/null 2>&1; r=$?
rm -rf .labs/work/bad
test $r -eq 1
```

## Hints

1. Use `readdirSync(dir, { recursive: true })` and test each name with a regular expression.
2. Test the last path segment only, such as `/^[a-z0-9.-]+$/`. Folders can be tested the same way.
3. Print each offender, set `process.exitCode = 1` when the list is not empty.
4. Commands: `cat scripts/check-conventions.ts`, `mkdir -p .labs/work`, `node .labs/work/check-kebab.mjs docs; echo $?`.

## What you just learned

One script that walks every file beats a reviewer's memory. Prove it by planting a bad file and watching it go red.
