# Build context is the repo root: docker build -f api/Dockerfile .
FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY shared ./shared
COPY api ./api
RUN npm ci --workspace api --workspace shared --include-workspace-root=false
# The key is never baked in. It arrives at runtime, as a container variable.
USER node
EXPOSE 8787
CMD ["npx", "tsx", "api/src/main.ts"]
