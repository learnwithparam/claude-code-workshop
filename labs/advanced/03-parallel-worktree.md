# Work in a parallel worktree

**Pairs with:** `docs/electives/agent-teams.md`
**Help:** goal

## Warm-up

What do you do instead of re-explaining a task to Claude?
From: daily-01
Answer: Resume the saved session and carry on from where you left off.

## Goal

Create a second checkout of this repo at .labs/work/wt on a new branch named lab/parallel, so two sessions can edit at once without sharing files. Keep it until the proof passes, then remove it. The proof below must pass.

## Predict

Can you check out the same branch in two worktrees at once?

Answer: No. Git allows a branch in only one worktree, so the second worktree needs its own new branch.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Make the lab work folder.
3. Add a worktree there on a new branch.
4. Open a Claude session inside it, then leave.
5. Run make lab while the worktree still exists, so the proof can see it.
6. Then remove the worktree. To redo the lab later, delete the branch too.

## Proof

1. The worktree folder has a .git file.

   ```sh
   test -f .labs/work/wt/.git
   ```
2. That .git file points at a gitdir.

   ```sh
   grep -q 'gitdir' .labs/work/wt/.git
   ```
3. The worktree belongs to this repo and sits on the branch lab/parallel.

   ```sh
   w=.labs/work/wt
   test -f $w/.git && grep -q '^gitdir: ' $w/.git || exit 1
   common=$(cd "$(git rev-parse --git-common-dir)" && pwd -P)
   case "$(sed 's/^gitdir: //' $w/.git)" in "$common"/worktrees/*) ;; *) exit 1 ;; esac
   test "$(git -C $w branch --show-current)" = lab/parallel
   ```

## Hints

1. A worktree has a `.git` file, not a folder, that points at the main checkout.
2. `-b lab/parallel` makes a new branch, because one branch cannot be checked out twice.
3. Run the add command from the repo root, not from inside `.labs`.
4. Commands: `mkdir -p .labs/work`, `git worktree add .labs/work/wt -b lab/parallel`, `cd .labs/work/wt && claude`, `git worktree remove .labs/work/wt`.

## What you just learned

Parallel work needs separate working folders. Two sessions in one folder overwrite each other.
