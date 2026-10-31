# Elective: Ide

**Extends:** context. **Proof:** Review a builder change in the terminal diff by hand.

## Goal

A diff in the terminal is hard to read for more than a few lines.

## The problem

A diff in the terminal is hard to read for more than a few lines.

## Without

Read a builder change as plain `git diff` output.

## The config

- The VS Code and JetBrains extensions show Claude's edits as a diff you accept or reject, and share the open file and selection with the session.
- `/ide` connects a terminal session to an open editor.

## With

Open the repo in VS Code, connect with `/ide`, ask for a small change and review the diff in the editor.

## Run it

1. Open the folder in VS Code.
2. Type `claude`, then `/ide`.
3. Ask for a one-line change and accept it from the diff view.

## Prove it

There is no offline proof. The change you accept still goes through `make check`.

## Exercise

Track A: review one builder change in the editor. Track B: reject half of it and say why.

## Discussion

What do you notice in a side-by-side diff that you skim past in a terminal?
