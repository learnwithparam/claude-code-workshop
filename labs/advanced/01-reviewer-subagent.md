# Write a read-only reviewer subagent

**Pairs with:** `docs/levels/execution.md`
**Help:** goal

## Warm-up

Why does a hook beat a rule written in a prompt?
From: daily-04
Answer: Exit code 2 blocks the action every time, even when the model forgets the rule.

## Goal

Write a read-only reviewer subagent at .labs/work/agents/reviewer.md: front matter with name, description, tools limited to Read, Grep and Glob, and model, then a short prompt. The proof below must pass.

## Predict

A reviewer subagent lists only Read, Grep and Glob as tools. Can it quietly fix a bug it finds?

Answer: No. Without Write or Edit it has no way to change a file, so its report is the only thing it can produce.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Read a real subagent in this repo.
3. Make the agents folder under the lab work folder.
4. [editor] Write the file with the four front matter keys and a short prompt.
5. Limit tools to reading and searching only.

## Proof

1. The agent file has the name reviewer.

   ```sh
   grep -q '^name: reviewer' .labs/work/agents/reviewer.md
   ```
2. The agent file has a description.

   ```sh
   grep -q '^description: ' .labs/work/agents/reviewer.md
   ```
3. The tools line lists exactly Read, Grep, Glob.

   ```sh
   grep -q '^tools: Read, Grep, Glob$' .labs/work/agents/reviewer.md
   ```
4. The agent file names a model.

   ```sh
   grep -q '^model: ' .labs/work/agents/reviewer.md
   ```
5. No tool that writes or runs commands (Write, Edit, Bash) is listed.

   ```sh
   f=.labs/work/agents/reviewer.md; test -f $f && ! grep -Eq '^tools:.*(Write|Edit|Bash)' $f
   ```

## Hints

1. Four front matter keys: `name`, `description`, `tools`, `model`.
2. The tools line is exactly `tools: Read, Grep, Glob`.
3. Pick a small model for the `model` line. A reviewer reads, it does not need the largest.
4. Commands: `ls .claude/agents`, then `cat` one file in it, then `mkdir -p .labs/work/agents`.

## What you just learned

The tools list is the fence. A reviewer without Write cannot fix things quietly, so its report is the whole truth.
