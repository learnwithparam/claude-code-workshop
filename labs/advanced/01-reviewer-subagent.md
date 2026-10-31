# Write a read-only reviewer subagent

**Pairs with:** `docs/levels/execution.md`
**Help:** goal

## Goal

Write a read-only reviewer subagent at .labs/work/agents/reviewer.md: front matter with name, description, tools limited to Read, Grep and Glob, and model, then a short prompt. The proof below must pass.

## Steps

1. Read a real subagent in this repo.
2. Make the agents folder under the lab work folder.
3. Write the file with the four front matter keys and a short prompt.
4. Limit tools to reading and searching only.

## Proof

```sh
f=.labs/work/agents/reviewer.md
test "$(sed -n 1p $f)" = '---' && test "$(grep -c '^---$' $f)" -ge 2 || exit 1
grep -q '^name: reviewer' $f && grep -Eq '^description: [^ ]+ [^ ]+ [^ ]+ [^ ]+' $f || exit 1
grep -q '^tools: Read, Grep, Glob$' $f && grep -Eq '^model: (haiku|sonnet|opus)$' $f || exit 1
! grep -Eq '^tools:.*(Write|Edit|Bash)' $f || exit 1
test "$(awk '/^---$/{n++; next} n>=2 && NF>=5' $f | wc -l)" -ge 1
```

## Hints

1. Four front matter keys: `name`, `description`, `tools`, `model`.
2. The tools line is exactly `tools: Read, Grep, Glob`.
3. Pick a small model for the `model` line. A reviewer reads, it does not need the largest.
4. Commands: `ls .claude/agents`, then `cat` one file in it, then `mkdir -p .labs/work/agents`.

## What you just learned

The tools list is the fence. A reviewer without Write cannot fix things quietly, so its report is the whole truth.
