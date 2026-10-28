---

paths:
- "web/**"

---

- Static Astro only. No adapter, no server code, no env file.
- The only env var is `PUBLIC_API_URL`. Never read another one.
- Colours and fonts come from the tokens at the top of `index.astro`.
