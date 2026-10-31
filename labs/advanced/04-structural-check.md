# Write a check that walks the whole tree

**Pairs with:** `docs/levels/workflows.md`
**Help:** goal

## Warm-up

What does the workflow contract test walk?
From: factory-04
Answer: Every workflow file, so one edit that breaks a stage shows up at once.

## Goal

Write .labs/work/check-kebab.mjs: given a folder, it walks it, prints each file whose name is not lowercase with dashes and dots, and exits 1 if any. Prove it passes on docs and fails on a bad tree. The proof below must pass.

## Steps

1. Read one: `cat scripts/check-conventions.ts`.
2. Make the folder: `mkdir -p .labs/work`.
3. [editor] Write `.labs/work/check-kebab.mjs`. It takes a folder, walks it, prints each file whose name is not lowercase with dashes and dots, and exits 1 if it found any.
4. Try it on a folder that follows the rule (`docs/` itself holds `README.md`, which your check rightly flags): `node .labs/work/check-kebab.mjs docs/levels; echo $?`.

## Proof

1. check-kebab.mjs passes on the docs/levels folder.

   ```sh
   node .labs/work/check-kebab.mjs docs/levels >/dev/null 2>&1
   ```
2. check-kebab.mjs fails on a folder that holds BadName.txt.

   ```sh
   test -f .labs/work/check-kebab.mjs || exit 1
   d=.labs/work/bad; mkdir -p $d && : > $d/BadName.txt
   node .labs/work/check-kebab.mjs $d >/dev/null 2>&1; r=$?
   rm -rf $d
   test $r -eq 1
   ```

## Hints

1. Use `readdirSync(dir, { recursive: true })` and test each name with a regular expression.
2. Test the last path segment only, such as `/^[a-z0-9.-]+$/`. Folders can be tested the same way.
3. Print each offender, set `process.exitCode = 1` when the list is not empty.
4. Commands: `cat scripts/check-conventions.ts`, `mkdir -p .labs/work`, `node .labs/work/check-kebab.mjs docs/levels; echo $?`.

## What you just learned

One script that walks every file beats a reviewer's memory. Prove it by planting a bad file and watching it go red.
