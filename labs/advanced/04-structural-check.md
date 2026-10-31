# Write a check that walks the whole tree

**Pairs with:** `docs/levels/workflows.md`
**Help:** goal

## Goal

Write .labs/work/check-kebab.mjs: given a folder, it walks it, prints each file whose name is not lowercase with dashes and dots, and exits 1 if any. Prove it passes on a clean tree and fails on a bad one. The proof below must pass.

## Steps

1. Read an existing check in this repo.
2. Make the lab work folder.
3. Write the walker and the name rule, printing every offender.
4. Run it on the docs folder and look at the exit code. It lists `README.md`, because this repo's own check allows a few fixed names. Yours does not need to.

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
3. check-kebab.mjs passes a good tree, then fails a bad one and a nested one and names the offender.

   ```sh
   s=.labs/work/check-kebab.mjs
   b=.labs/work/trees
   rm -rf $b; mkdir -p $b/good/sub-dir $b/bad $b/nested/Folder
   : > $b/good/ok-name.md; : > $b/good/sub-dir/a.b.txt; : > $b/bad/BadName.txt; : > $b/nested/Folder/x.txt
   node $s $b/good >/dev/null 2>&1; g=$?
   out=$(node $s $b/bad 2>/dev/null); r=$?
   node $s $b/nested >/dev/null 2>&1; n=$?
   rm -rf $b
   test $g -eq 0 && test $r -eq 1 && test $n -eq 1 && echo "$out" | grep -q BadName.txt
   ```

## Hints

1. Use `readdirSync(dir, { recursive: true })` and test each name with a regular expression.
2. Test the last path segment only, such as `/^[a-z0-9.-]+$/`. Folders can be tested the same way.
3. Print each offender, set `process.exitCode = 1` when the list is not empty. The proof also feeds it a clean tree and a bad folder name.
4. Commands: `cat scripts/check-conventions.ts`, `mkdir -p .labs/work`, `node .labs/work/check-kebab.mjs docs; echo $?`.

## What you just learned

One script that walks every file beats a reviewer's memory. Prove it by planting a bad file and watching it go red.
