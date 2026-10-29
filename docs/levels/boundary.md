# Boundary: a secret lives in one process

**Layer:** boundary. **Proof:** `make prove LEVEL=boundary`.

## Goal

The API key exists in exactly one place, the `api/` process. The browser bundle, the git history, the Docker image and Claude's shell never hold it.

## The problem

A quick fix renames the key to `PUBLIC_ANTHROPIC_API_KEY` so a browser component can call Claude directly. After `npm run build`, `grep -r sk-ant web/dist` finds the key in shipped JavaScript. Separately, asked to "debug the env", Claude runs `cat` on the secrets file, because a Read deny does not cover Bash.

## Without

Do the rename on a scratch branch, build, and grep. The key is public. Then deny Read on the secrets file in `.claude/settings.json` and ask Claude to print it. The `cat` still works. That is the trap.

## The config

- `web/` is static. It reads `PUBLIC_API_URL` and nothing else, and has no server adapter.
- `api/src/env.ts` parses the environment with zod at boot, fails fast, and never echoes a value.
- `api/src/server.ts` enforces a CORS allowlist, a 16 KB body cap, a rate limit, a daily budget and generic error bodies.
- `api/Dockerfile` has no secret `ARG` or `ENV`. The key arrives at runtime.
- `.claude/settings.json` denies Read and Edit on the secrets file and `git push`, and turns the sandbox on with `denyRead`.
- `.claude/hooks/pretooluse-secrets.mjs` blocks a Bash command that names the secrets file. Exit 2 stops the call.
- `.gitleaks.toml` plus `make hooks` scans every commit.

## With

Repeat the "debug the env" prompt. The hook blocks the command and tells Claude to load the file inside a script. Repeat the build and grep. Nothing is found.

## Run it

1. Type `make hooks`. Expect the pre-commit hook installed.
2. Type `make smoke` after putting a key in `api/`'s local env file. Expect one clarifying question, then a worksheet.
3. Open the browser network tab. Expect calls to `/chat` only, never to api.anthropic.com.

## Prove it

`make prove LEVEL=boundary` greps the built bundle for key shapes, checks that `web/` reads only `PUBLIC_` variables, checks the Dockerfile, checks the 500 body has no model name or stack, and runs the hook against known bad commands.

## Exercise

Track A: add a second secret to `api/src/env.ts` and prove the bundle stays clean. Track B: write a hook case for a command that reads the file through `base64`.

## Go further: modes and scopes

- Settings merge from user, project, local and managed scopes, and a deny rule in any scope wins. `.claude/settings.json` is the project scope and is committed. Put personal changes in `.claude/settings.local.json`, which stays out of git.
- Start the same risky ask in `default`, `plan` and `acceptEdits` (`claude --permission-mode plan`) and note which tool calls each mode allowed without asking. The factory picks one per stage in `.factory/config.json`: `plan` for reading stages, `acceptEdits` for build.
- A dev container keeps a mistake off your laptop. Open the repo in one and the sandbox plus the deny rules are a second wall around the same secret.

## Discussion

Where does a secret live in your stack today, and which processes can read it?
