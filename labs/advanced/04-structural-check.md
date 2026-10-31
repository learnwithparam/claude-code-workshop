# Write a check that walks the whole tree

**Pairs with:** `docs/levels/workflows.md`
**Help:** goal

## Warm-up

What does the workflow contract test walk?
From: factory-04
Answer: Every workflow file, so one edit that breaks a stage shows up at once.

## Goal

Write .labs/work/check-kebab.mjs: given a folder, it walks it, prints each file whose name is not lowercase with dashes and dots, and exits 1 if any. Prove it passes on a clean tree and fails on a bad one. The proof below must pass.

## Predict

Your kebab-case check passes on the real tree. How do you know it would ever fail?

Answer: You cannot tell until you plant a bad file. Seeing it exit 1 on that file is what proves the check can catch a mistake.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Read one: `cat scripts/check-conventions.ts`.
   Expect: A short script that walks files, tests each name and sets an exit code.
3. Make the folder: `mkdir -p .labs/work`.
   Expect: No output. The folder `.labs/work` now exists.
4. [editor] Write `.labs/work/check-kebab.mjs`. It takes a folder, walks it, prints each file whose name is not lowercase with dashes and dots, and exits 1 if it found any.
   Expect: No output from a command, since you are writing the file. Afterwards it walks a folder, prints offenders and exits 1 when it finds any.
5. Try it on a folder that follows the rule (`docs/` itself holds `README.md`, which your check rightly flags): `node .labs/work/check-kebab.mjs docs/levels; echo $?`.
   Expect: No offender lines, then `0` on the last line. A `1` means your check flagged a name that follows the rule.

## Proof

1. check-kebab.mjs passes on a folder of kebab-case names.

   ```sh
   test -f .labs/work/check-kebab.mjs || exit 1
   d=.labs/work/good; mkdir -p $d && : > $d/ok-name.md
   node .labs/work/check-kebab.mjs $d >/dev/null 2>&1; r=$?
   rm -rf $d
   test $r -eq 0
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
4. Commands: `cat scripts/check-conventions.ts`, `mkdir -p .labs/work`, `node .labs/work/check-kebab.mjs docs/levels; echo $?`.

## What you just learned

One script that walks every file beats a reviewer's memory. Prove it by planting a bad file and watching it go red.
