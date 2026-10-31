# Write a read-only reviewer subagent

**Pairs with:** `docs/levels/execution.md`

## Goal

Define a subagent that can read and search but cannot write, so a review can never change the code.

## Steps

1. Read a real one: `ls .claude/agents` then `cat` one.
   Expect: A list of agent file names from `.claude/agents`, then the first lines of one file starting with `---` and keys such as `name`, `description` and `tools`.
2. Make the folder: `mkdir -p .labs/work/agents`.
   Expect: No output. The folder `.labs/work/agents` now exists.
3. Write `.labs/work/agents/reviewer.md` with front matter `name`, `description`, `tools` and `model`, then a short prompt.
   Expect: No output from a command, since you are writing the file. Afterwards its first lines are the four keys between two `---` lines.
4. The `tools` line lists only `Read, Grep, Glob`.
   Expect: Only a read-only line, `tools: Read, Grep, Glob`, with no `Write`, `Edit` or `Bash` in it.

## Proof

```sh
f=.labs/work/agents/reviewer.md; grep -q '^name: reviewer' $f && grep -q '^description: ' $f && grep -q '^tools: Read, Grep, Glob$' $f && grep -q '^model: ' $f && ! grep -Eq '^tools:.*(Write|Edit|Bash)' $f
```

## Hints

1. Four front matter keys: `name`, `description`, `tools`, `model`.
2. The tools line is exactly `tools: Read, Grep, Glob`.
3. Pick a small model for the `model` line. A reviewer reads, it does not need the largest.

## What you just learned

The tools list is the fence. A reviewer without Write cannot fix things quietly, so its report is the whole truth.
