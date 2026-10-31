# Work in a parallel worktree

**Pairs with:** `docs/electives/agent-teams.md`

## Goal

Create a second checkout of the repo so two Claude sessions can edit at once without touching each other's files.

## Steps

1. Make the folder: `mkdir -p .labs/work`.
2. Add the worktree: `git worktree add .labs/work/wt -b lab/parallel`.
3. Start a session in it: `cd .labs/work/wt && claude`, then leave with `/exit`.
4. Remove it when you are done: `git worktree remove .labs/work/wt`. Keep it until the proof is green.

## Proof

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

## What you just learned

Parallel work needs separate working folders. Two sessions in one folder overwrite each other.
