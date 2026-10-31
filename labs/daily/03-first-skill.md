# Package a habit as a skill

**Pairs with:** `docs/levels/skills.md`
**Help:** hinted

## Warm-up

What does plan mode turn "do it" into?
From: start-03
Answer: "Show me first": Claude lays out a plan and waits for your approval.

## Goal

Write a skill that Claude loads by its description, so you stop pasting the same instructions.

## Steps

1. Read one: `ls .claude/skills` then open a `SKILL.md`.
2. Make the folder: `mkdir -p .labs/work/skills/commit-message`.
3. [editor] Create `.labs/work/skills/commit-message/SKILL.md` with `name:` and `description:` front matter, then the steps.
4. The description starts with `Use when` and names the situation, not what the skill is.

## Proof

1. SKILL.md has the name commit-message.

   ```sh
   grep -q '^name: commit-message' .labs/work/skills/commit-message/SKILL.md
   ```
2. The description starts with Use when.

   ```sh
   grep -q '^description: Use when' .labs/work/skills/commit-message/SKILL.md
   ```
3. SKILL.md has at least eight non-empty lines.

   ```sh
   test "$(grep -c . .labs/work/skills/commit-message/SKILL.md)" -ge 8
   ```

## Hints

1. Front matter needs exactly `name: commit-message` and a `description:` that starts with `Use when`.
2. The body should have at least a few lines of steps.
3. Good first steps: read the staged diff, write a subject under 60 characters, say why in the body.
4. Commands, in order: `ls .claude/skills`, then `cat` one SKILL.md, `mkdir -p .labs/work/skills/commit-message`.

## What you just learned

A skill is loaded on demand. The description is the trigger, so write it as a situation.
