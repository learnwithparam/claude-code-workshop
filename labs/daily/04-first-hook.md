# Block a mistake with a hook

**Pairs with:** `docs/levels/boundary.md`
**Help:** hinted

## Goal

Write a hook that stops Claude from editing `.env`, and prove it by feeding it both cases.

## Predict

A hook receives a tool call as JSON on standard input. Which exit code stops the action, and what does the other case need?

Answer: Exit code 2 blocks the action. Any other path, including a clean exit 0, lets the action through.

## Steps

1. Read a real hook: `cat .claude/hooks/pretooluse-file-guard.mjs`.
2. Make the folder: `mkdir -p .labs/work/hooks`.
3. Write `.labs/work/hooks/block-env.mjs`. It reads JSON from stdin, looks at `tool_input.file_path`, and exits with code 2 and a message on stderr when the path ends in `.env`. Otherwise it exits 0.
4. Try it: `echo '{"tool_input":{"file_path":".env"}}' | node .labs/work/hooks/block-env.mjs; echo $?`.

## Proof

1. The hook exits 2 when the file is the secrets file.

   ```sh
   echo '{"tool_input":{"file_path":".env"}}' | node .labs/work/hooks/block-env.mjs >/dev/null 2>&1; test $? -eq 2
   ```
2. The hook exits 0 when the file is a.ts.

   ```sh
   echo '{"tool_input":{"file_path":"a.ts"}}' | node .labs/work/hooks/block-env.mjs >/dev/null 2>&1
   ```

## Hints

1. Read all of stdin first: `const input = JSON.parse(readFileSync(0, "utf8"))`.
2. Exit code 2 tells Claude Code to block the call and show stderr to the model.
3. Import `readFileSync` from `node:fs` and end with `process.exit(0)` for the allowed case.
4. Commands, in order: `cat .claude/hooks/pretooluse-file-guard.mjs`, `mkdir -p .labs/work/hooks`, `echo '{"tool_input":{"file_path":".env"}}' | node .labs/work/hooks/block-env.mjs; echo $?`.

## What you just learned

A hook is a program, not a prompt. Exit code 2 blocks the action every time, even when the model would have forgotten the rule.
