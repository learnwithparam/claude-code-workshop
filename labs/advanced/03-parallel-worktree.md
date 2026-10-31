# Work in a parallel worktree

**Pairs with:** `docs/electives/agent-teams.md`
**Help:** goal

## Goal

Create a second checkout of this repo at .labs/work/wt on a new branch, so two sessions can edit at once without sharing files. Keep it until the proof passes, then remove it. The proof below must pass.

## Steps

1. Make the lab work folder.
2. Add a worktree there on a new branch.
3. Open a Claude session inside it, then leave.
4. Remove the worktree once the proof is green.

## Proof

```sh
test -f .labs/work/wt/.git && grep -q 'gitdir' .labs/work/wt/.git
```

## Hints

1. A worktree has a `.git` file, not a folder, that points at the main checkout.
2. `-b lab/parallel` makes a new branch, because one branch cannot be checked out twice.
3. Run the add command from the repo root, not from inside `.labs`.
4. Commands: `mkdir -p .labs/work`, `git worktree add .labs/work/wt -b lab/parallel`, `cd .labs/work/wt && claude`, `git worktree remove .labs/work/wt`.

## What you just learned

Parallel work needs separate working folders. Two sessions in one folder overwrite each other.
