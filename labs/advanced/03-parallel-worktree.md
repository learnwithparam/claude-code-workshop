# Work in a parallel worktree

**Pairs with:** `docs/electives/agent-teams.md`

## Goal

Create a second checkout of the repo so two Claude sessions can edit at once without touching each other's files.

## Steps

1. Make the folder: `mkdir -p .labs/work`.
2. Add the worktree: `git worktree add .labs/work/wt -b lab/parallel`.
3. Start a session in it: `cd .labs/work/wt && claude`, then leave with `/exit`.
4. Run `make lab` while the worktree still exists, so the proof can see it.
5. Then remove it: `git worktree remove .labs/work/wt`. To redo the lab later, delete the branch too: `git branch -D lab/parallel`.

## Proof

```sh
test -f .labs/work/wt/.git && grep -q 'gitdir' .labs/work/wt/.git
```

## Hints

1. A worktree has a `.git` file, not a folder, that points at the main checkout.
2. `-b lab/parallel` makes a new branch, because one branch cannot be checked out twice.
3. Run the add command from the repo root, not from inside `.labs`.

## What you just learned

Parallel work needs separate working folders. Two sessions in one folder overwrite each other.
