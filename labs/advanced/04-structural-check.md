# Write a check that walks the whole tree

**Pairs with:** `docs/levels/workflows.md`

## Goal

Write a script that fails when any file name is not kebab-case, then prove it fails on a bad tree.

## Steps

1. Read one: `cat scripts/check-conventions.ts`.
2. Make the folder: `mkdir -p .labs/work`.
3. Write `.labs/work/check-kebab.mjs`. It takes a folder, walks it, prints each file whose name is not lowercase with dashes and dots, and exits 1 if it found any.
4. Try it on the docs: `node .labs/work/check-kebab.mjs docs; echo $?`. It lists `README.md` because this repo's own check allows a few fixed names. Yours does not need to.

## Proof

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

## What you just learned

One script that walks every file beats a reviewer's memory. Prove it by planting a bad file and watching it go red.
