# Write a rule that loads only where it applies

**Pairs with:** `docs/levels/context.md`
**Help:** hinted

## Warm-up

Why does a private habit not belong in `AGENTS.md`?
From: start-04
Answer: `AGENTS.md` is committed and shared, so the habit would land on everyone.

## Goal

Write a rule file scoped to one folder, so Claude reads it only when it works there.

## Predict

A rule file lists paths in its frontmatter. When does Claude load it?

Answer: Only when Claude reads a file whose path matches. Unmatched rules cost no context, which is why scoping them matters.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Read a real one: `ls .claude/rules` then `cat` any file in it.
   Expect: A list of rule file names, then the text of one. Look for a `paths:` line between two `---` lines, then bullets.
3. Make a draft folder: `mkdir -p .labs/work/rules`.
   Expect: No output. The folder `.labs/work/rules` now exists.
4. [editor] Create `.labs/work/rules/api-errors.md` with a `paths:` front matter for `api/**` and two rules about customer-facing errors.
   Expect: No output from a command, since you are writing the file. Afterwards the first line of the file is `---`.
5. When you like it, copy it to `.claude/rules/` in your own project.
   Expect: No output when the copy works. `ls .claude/rules` in your own project then lists `api-errors.md`.

## Proof

1. The rule file starts with a --- line.

   ```sh
   head -1 .labs/work/rules/api-errors.md | grep -q '^---$'
   ```
2. The front matter has a paths: key.

   ```sh
   grep -q '^paths:' .labs/work/rules/api-errors.md
   ```
3. The rule has at least two bullet lines.

   ```sh
   test "$(grep -c '^- ' .labs/work/rules/api-errors.md)" -ge 2
   ```
4. The rule file is well formed and its paths point at a folder that exists.

   ```sh
   f=.labs/work/rules/api-errors.md
   head -1 $f | grep -q '^---$' && grep -q '^paths:' $f && test "$(grep -c '^- ' $f)" -ge 2 || exit 1
   for p in $(sed -n 's/^  - //p' $f | sed 's|/[*].*||'); do test -d "$p" && exit 0; done
   exit 1
   ```

## Hints

1. The file starts with `---`, then a `paths:` list, then `---`, then bullets starting with `- `.
2. A path is a glob such as `api/**`.
3. Write rules as checks you could fail, such as "an error to a customer never names the model".
4. Commands, in order: `ls .claude/rules`, then `cat` any file in it, `mkdir -p .labs/work/rules`.

## What you just learned

Rules cost context only when their paths match. Scope every rule to the files it governs.
