# Block a mistake with a hook

**Pairs with:** `docs/levels/boundary.md`

## Goal

Write a hook that stops Claude from editing `.env`, and prove it by feeding it both cases.

## Steps

1. Read a real hook: `cat .claude/hooks/pretooluse-file-guard.mjs`.
   Expect: A short Node script that reads JSON from stdin, checks a path and calls `process.exit`.
2. Make the folder: `mkdir -p .labs/work/hooks`.
   Expect: No output. The folder `.labs/work/hooks` now exists.
3. Write `.labs/work/hooks/block-env.mjs`. It reads JSON from stdin, looks at `tool_input.file_path`, and exits with code 2 and a message on stderr when the path ends in `.env`. Otherwise it exits 0.
   Expect: No output from a command, since you are writing the file. Afterwards it contains an exit with code 2, a message sent to stderr, and an exit with code 0.
4. Try it: `echo '{"tool_input":{"file_path":".env"}}' | node .labs/work/hooks/block-env.mjs; echo $?`.
   Expect: One message saying the edit is blocked, then `2` on the last line. A `0` means your hook let the edit through.

## Proof

```sh
h=.labs/work/hooks/block-env.mjs
echo '{"tool_input":{"file_path":".env"}}' | node $h >/dev/null 2>&1; test $? -eq 2 || exit 1
echo '{"tool_input":{"file_path":"a.ts"}}' | node $h >/dev/null 2>&1
```

## Hints

1. Read all of stdin first: `const input = JSON.parse(readFileSync(0, "utf8"))`.
2. Exit code 2 tells Claude Code to block the call and show stderr to the model.
3. Import `readFileSync` from `node:fs` and end with `process.exit(0)` for the allowed case.

## What you just learned

A hook is a program, not a prompt. Exit code 2 blocks the action every time, even when the model would have forgotten the rule.
