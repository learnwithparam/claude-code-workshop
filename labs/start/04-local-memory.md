# Teach Claude a personal habit

**Pairs with:** `docs/levels/context.md`

## Goal

Write one private preference into `CLAUDE.local.md` so Claude follows it in this repo and nowhere else.

## Predict

Claude follows a note you put in CLAUDE.local.md. Will a teammate who clones the repo get that note?

Answer: No. CLAUDE.local.md is gitignored, so the note stays on your machine and a clone never carries it.

## Steps

1. See the example: `cat docs/examples/CLAUDE.local.md`.
2. Add a line to your own file: `echo "- lab-note: explain each change in two plain sentences." >> CLAUDE.local.md`.
3. Check it loads: `claude -p "What preferences do my local notes give you?"`.

## Proof

```sh
grep -q 'lab-note' CLAUDE.local.md && grep -q 'CLAUDE.local.md' .gitignore
```

## Hints

1. The proof wants the text `lab-note` in `CLAUDE.local.md` at the repo root.
2. The file is already in `.gitignore`, so it never reaches a commit.
3. Use `>>` to append. A single `>` replaces the file.

## What you just learned

`AGENTS.md` is for the team and `CLAUDE.local.md` is for you. Private habits never belong in a shared file.
