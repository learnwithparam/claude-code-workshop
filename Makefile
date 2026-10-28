.PHONY: doctor dev check prove levels smoke hooks eval factory

doctor:
	@node -v | grep -qE '^v2[2-9]' && echo "ok node $$(node -v)" || (echo "need Node 22+" && exit 1)
	@claude --version 2>/dev/null || echo "warn: claude not on PATH"

dev:
	npm run dev -w web

# The gate. Every proof is wired in here, so an unwired check cannot exist.
check:
	npm run lint
	npm run typecheck
	npm test
	npm run build -w web
	npm run prove

prove:
	npm run prove -- $(LEVEL)

smoke:
	npx tsx api/src/smoke.ts

hooks:
	cp scripts/git/pre-commit .git/hooks/pre-commit

eval:
	npx tsx api/src/eval.ts

factory:
	npx tsx factory/main.ts $(ISSUE) $(FLAGS)

levels:
	npx tsx scripts/levels.ts $(LEVEL)
