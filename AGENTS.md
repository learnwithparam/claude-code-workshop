# Worksheet Studio

Prompt in, worksheet out. A chat agent (Claude Haiku 5.5) asks one question if the grade is unclear, then fills a worksheet that `shared/` renders.

## Commands

- `make check` is the gate. Run it before saying done.
- `make dev` starts the web app. `make smoke` and `make eval` spend tokens.

## Workspace map

- `web/` Astro, static output only. Reads `PUBLIC_API_URL` and nothing else.
- `api/` Hono. The only process that holds `ANTHROPIC_API_KEY`.
- `shared/` band table, schema, check, render. The model fills content; this code decides layout.
- `factory/` the runner that works on this repo.

## Standards

- npm only. Font is Geist. Node 22, TypeScript strict, no `any`.
- Files and folders are kebab-case. A test sits beside its code as `x.test.ts`.
- One concept per module, named for the thing. No `utils/`, `helpers/`, `misc/` or `common/`.
- Named exports only. Default exports only in `web/src/pages/`.
- Validate every boundary with zod: env, HTTP body, model tool input.
- Errors to a customer are generic. No model name, token count or stack trace.
- A file stays under 300 lines. Comments say why, not what.
- A bug fix ships a test that fails without it.

## Done means

`make check` passes with zero errors and zero warnings, and you ran the thing.
