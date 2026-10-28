.PHONY: doctor dev check prove smoke hooks

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
	npm run prove -- $(L)

smoke:
	npx tsx api/src/smoke.ts

hooks:
	cp scripts/git/pre-commit .git/hooks/pre-commit
