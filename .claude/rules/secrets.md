---

paths:
- "api/**"
- "**/Dockerfile"

---

- A secret exists in the api process only: never in `web/`, an image layer, or a log.
- Enforced by settings deny rules, the shell guard hook and the boundary proof.
