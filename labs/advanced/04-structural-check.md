# Write a check that walks the whole tree

**Pairs with:** `docs/levels/workflows.md`

## Goal

Write a script that fails when any file name is not kebab-case, then prove it fails on a bad tree.

## Steps

1. Read one: `cat scripts/check-conventions.ts`.
2. Make the folder: `mkdir -p .labs/work`.
3. Write `.labs/work/check-kebab.mjs`. It takes a folder, walks it, prints each file whose name is not lowercase with dashes and dots, and exits 1 if it found any.
4. Try it on the docs: `node .labs/work/check-kebab.mjs docs; echo $?`.

## Proof

1. check-kebab.mjs passes on the docs folder.

   ```sh
   node .labs/work/check-kebab.mjs docs >/dev/null 2>&1
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

## What you just learned

One script that walks every file beats a reviewer's memory. Prove it by planting a bad file and watching it go red.
