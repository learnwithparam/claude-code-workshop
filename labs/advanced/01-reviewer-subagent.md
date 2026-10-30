# Write a read-only reviewer subagent

**Pairs with:** `docs/levels/execution.md`

## Goal

Define a subagent that can read and search but cannot write, so a review can never change the code.

## Steps

1. Read a real one: `ls .claude/agents` then `cat` one.
2. Make the folder: `mkdir -p .labs/work/agents`.
3. Write `.labs/work/agents/reviewer.md` with front matter `name`, `description`, `tools` and `model`, then a short prompt.
4. The `tools` line lists only `Read, Grep, Glob`.

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
