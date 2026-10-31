# Package a habit as a skill

**Pairs with:** `docs/levels/skills.md`
**Help:** hinted

## Goal

Write a skill that Claude loads by its description, so you stop pasting the same instructions.

## Steps

1. Read one: `ls .claude/skills` then open a `SKILL.md`.
2. Make the folder: `mkdir -p .labs/work/skills/commit-message`.
3. Create `.labs/work/skills/commit-message/SKILL.md` with `name:` and `description:` front matter, then the steps.
4. The description says when to use it, not what it is.

## Proof

```sh
f=.labs/work/skills/commit-message/SKILL.md; grep -q '^name: commit-message' $f && grep -q '^description: Use when' $f && test "$(grep -c . $f)" -ge 8
```

## Hints

1. Front matter needs exactly `name: commit-message` and a `description:` that starts with `Use when`.
2. The body should have at least a few lines of steps.
3. Good first steps: read the staged diff, write a subject under 60 characters, say why in the body.
4. Commands, in order: `ls .claude/skills`, then `cat` one SKILL.md, `mkdir -p .labs/work/skills/commit-message`.

## What you just learned

A skill is loaded on demand. The description is the trigger, so write it as a situation.
