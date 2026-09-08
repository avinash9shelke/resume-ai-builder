# Build context is the repository root (see docker-compose.yml), so this
# image can install the shared @resume-ai/schema and @resume-ai/ui-core
# workspace packages.
FROM node:20-slim AS builder
WORKDIR /workspace

COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY packages/resume-schema packages/resume-schema
COPY packages/ui-core packages/ui-core
RUN npm install --workspace=apps/web --workspace=packages/resume-schema --workspace=packages/ui-core

WORKDIR /workspace/packages/resume-schema
RUN npm run build
WORKDIR /workspace/packages/ui-core
RUN npm run build

WORKDIR /workspace/apps/web
COPY apps/web ./
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /workspace/apps/web/.next ./.next
COPY --from=builder /workspace/apps/web/public ./public
COPY --from=builder /workspace/apps/web/package.json ./package.json
COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/apps/web/node_modules ./apps/web/node_modules

EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
