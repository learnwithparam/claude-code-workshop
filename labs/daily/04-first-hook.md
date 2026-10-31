# Block a mistake with a hook

**Pairs with:** `docs/levels/boundary.md`
**Help:** hinted

## Warm-up

Does a skill load because of its name or its description?
From: daily-03
Answer: Its description. Claude matches the situation to the description, so write it as a situation.

## Goal

Write a hook that stops Claude from editing `.env`, and prove it by feeding it both cases.

## Predict

A hook receives a tool call as JSON on standard input. Which exit code stops the action, and what does the other case need?

Answer: Exit code 2 blocks the action. Any other path, including a clean exit 0, lets the action through.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Read a real hook: `cat .claude/hooks/pretooluse-file-guard.mjs`.
   Expect: A short Node script that reads JSON from stdin, checks a path and calls `process.exit`.
3. Make the folder: `mkdir -p .labs/work/hooks`.
   Expect: No output. The folder `.labs/work/hooks` now exists.
4. [editor] Write `.labs/work/hooks/block-env.mjs`. It reads JSON from stdin, looks at `tool_input.file_path`, and exits with code 2 and a message on stderr when the path ends in `.env`. Otherwise it exits 0.
   Expect: No output from a command, since you are writing the file. Afterwards it contains an exit with code 2, a message sent to stderr, and an exit with code 0.
5. Try it: `echo '{"tool_input":{"file_path":".env"}}' | node .labs/work/hooks/block-env.mjs; echo $?`.
   Expect: One message saying the edit is blocked, then `2` on the last line. A `0` means your hook let the edit through.

## Proof

1. The hook exits 2 when the file is the secrets file.

   ```sh
   echo '{"tool_input":{"file_path":".env"}}' | node .labs/work/hooks/block-env.mjs >/dev/null 2>&1; test $? -eq 2
   ```
2. The hook exits 0 when the file is a.ts.

   ```sh
   echo '{"tool_input":{"file_path":"a.ts"}}' | node .labs/work/hooks/block-env.mjs >/dev/null 2>&1
   ```
3. The hook blocks .env paths with a message and lets .env.example and a.ts through.

   ```sh
   h=.labs/work/hooks/block-env.mjs
   try() { echo "{\"tool_input\":{\"file_path\":\"$1\"}}" | node $h >/dev/null 2>.labs/work/err.txt; }
   try .env; test $? -eq 2 || exit 1
   test -s .labs/work/err.txt || exit 1
   try /repo/app/.env; test $? -eq 2 || exit 1
   try .env.example || exit 1
   try a.ts
   ```

## Hints

1. Read all of stdin first: `const input = JSON.parse(readFileSync(0, "utf8"))`.
2. Exit code 2 tells Claude Code to block the call and show stderr to the model.
3. Import `readFileSync` from `node:fs` and end with `process.exit(0)` for the allowed case.
4. Commands, in order: `cat .claude/hooks/pretooluse-file-guard.mjs`, `mkdir -p .labs/work/hooks`, `echo '{"tool_input":{"file_path":".env"}}' | node .labs/work/hooks/block-env.mjs; echo $?`.

## What you just learned

A hook is a program, not a prompt. Exit code 2 blocks the action every time, even when the model would have forgotten the rule.
