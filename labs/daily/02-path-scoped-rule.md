# Write a rule that loads only where it applies

**Pairs with:** `docs/levels/context.md`

## Goal

Write a rule file scoped to one folder, so Claude reads it only when it works there.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
2. Read a real one: `ls .claude/rules` then `cat` any file in it.
3. Make a draft folder: `mkdir -p .labs/work/rules`.
4. Create `.labs/work/rules/api-errors.md` with a `paths:` front matter for `api/**` and two rules about customer-facing errors.
5. When you like it, copy it to `.claude/rules/` in your own project.

## Proof

```sh
head -1 .labs/work/rules/api-errors.md | grep -q '^---$' && grep -q '^paths:' .labs/work/rules/api-errors.md && test "$(grep -c '^- ' .labs/work/rules/api-errors.md)" -ge 2
```

## Hints

1. The file starts with `---`, then a `paths:` list, then `---`, then bullets starting with `- `.
2. A path is a glob such as `api/**`.
3. Write rules as checks you could fail, such as "an error to a customer never names the model".

## What you just learned

Rules cost context only when their paths match. Scope every rule to the files it governs.
