# Work in a parallel worktree

**Pairs with:** `docs/electives/agent-teams.md`
**Help:** goal

## Goal

Create a second checkout of this repo at .labs/work/wt on a new branch, so two sessions can edit at once without sharing files. Keep it until the proof passes, then remove it. The proof below must pass.

## Steps

1. Make the lab work folder.
2. Add a worktree there on a new branch.
3. Open a Claude session inside it, then leave.
4. Run make lab while the worktree still exists, so the proof can see it.
5. Then remove the worktree. To redo the lab later, delete the branch too.

## Proof

1. The worktree folder has a .git file.

   ```sh
   test -f .labs/work/wt/.git
   ```
2. That .git file points at a gitdir.

   ```sh
   grep -q 'gitdir' .labs/work/wt/.git
   ```

## Hints

1. A worktree has a `.git` file, not a folder, that points at the main checkout.
2. `-b lab/parallel` makes a new branch, because one branch cannot be checked out twice.
3. Run the add command from the repo root, not from inside `.labs`.
4. Commands: `mkdir -p .labs/work`, `git worktree add .labs/work/wt -b lab/parallel`, `cd .labs/work/wt && claude`, `git worktree remove .labs/work/wt`.

## What you just learned

Parallel work needs separate working folders. Two sessions in one folder overwrite each other.
