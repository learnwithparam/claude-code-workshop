# Work in a parallel worktree

**Pairs with:** `docs/electives/agent-teams.md`

## Goal

Create a second checkout of the repo so two Claude sessions can edit at once without touching each other's files.

## Steps

1. Make the folder: `mkdir -p .labs/work`.
   Expect: No output. The folder `.labs/work` now exists.
2. Add the worktree: `git worktree add .labs/work/wt -b lab/parallel`.
   Expect: A line starting `Preparing worktree (new branch 'lab/parallel')` and a `HEAD is now at` line with the latest commit. The hash and message will differ.
3. Start a session in it: `cd .labs/work/wt && claude`, then leave with `/exit`.
   Expect: Claude opens in the new folder. After `/exit` you are back at your shell, still inside `.labs/work/wt`.
4. Remove it when you are done: `git worktree remove .labs/work/wt`. Keep it until the proof is green.
   Expect: No output when it works. If git refuses, it names the files you changed, so commit or discard them first.

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
