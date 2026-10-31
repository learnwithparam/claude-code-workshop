# Package a habit as a skill

**Pairs with:** `docs/levels/skills.md`
**Help:** hinted

## Warm-up

What does plan mode turn "do it" into?
From: start-03
Answer: "Show me first": Claude lays out a plan and waits for your approval.

## Goal

Write a skill that Claude loads by its description, so you stop pasting the same instructions.

## Predict

What makes Claude load a skill: its name, its body, or its description?

Answer: Its description. Claude reads the descriptions first and opens the body only when the situation matches.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Read one: `ls .claude/skills` then open a `SKILL.md`.
   Expect: A list of skill folder names, then a file starting with `---`, a `name:` line and a `description:` line.
3. Make the folder: `mkdir -p .labs/work/skills/commit-message`.
   Expect: No output. The folder `.labs/work/skills/commit-message` now exists.
4. [editor] Create `.labs/work/skills/commit-message/SKILL.md` with `name:` and `description:` front matter, then the steps.
   Expect: No output from a command, since you are writing the file. Afterwards it has `---`, `name: commit-message`, a `description: Use when` line and at least a few lines of steps.
5. The description starts with `Use when` and names the situation, not what the skill is.
   Expect: No output, since you are checking your own file. Its `description:` line starts with `Use when`.

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
4. The skill has a name, a Use when description and a body with real lines.

   ```sh
   f=.labs/work/skills/commit-message/SKILL.md
   grep -q '^name: commit-message' $f && grep -Eq '^description: Use when [^ ]+ [^ ]+ [^ ]+' $f || exit 1
   test "$(awk 'NF>=3' $f | wc -l)" -ge 4
   ```

## Hints

1. Front matter needs exactly `name: commit-message` and a `description:` that starts with `Use when`.
2. The body should have at least a few lines of steps.
3. Good first steps: read the staged diff, write a subject under 60 characters, say why in the body.
4. Commands, in order: `ls .claude/skills`, then `cat` one SKILL.md, `mkdir -p .labs/work/skills/commit-message`.

## What you just learned

A skill is loaded on demand. The description is the trigger, so write it as a situation.
