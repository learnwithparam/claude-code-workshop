---

paths:
- "api/**"

---

- The model name lives in `agent/model.ts` and nowhere else.
- Every route parses its body with zod before using it.
- A 500 sends a generic body. Log detail server-side only.
