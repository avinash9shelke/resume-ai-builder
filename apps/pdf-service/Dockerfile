# Build context is the repository root (see docker-compose.yml), so this
# image can install the shared @resume-ai/schema workspace package.
FROM node:20-slim

# Install a system Chromium instead of relying on Puppeteer's bundled
# download, which does not ship arm64 Linux builds.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /workspace

COPY package.json package-lock.json* ./
COPY apps/pdf-service/package.json apps/pdf-service/package.json
COPY packages/resume-schema packages/resume-schema
RUN npm install --workspace=apps/pdf-service --workspace=packages/resume-schema

COPY apps/pdf-service/tsconfig.json apps/pdf-service/tsconfig.json
COPY apps/pdf-service/src apps/pdf-service/src

WORKDIR /workspace/packages/resume-schema
RUN npm run build

WORKDIR /workspace/apps/pdf-service
RUN npx tsc -p tsconfig.json && mkdir -p dist/templates && cp -R src/templates/. dist/templates/
RUN npm prune --omit=dev

EXPOSE 4000
CMD ["node", "dist/server.js"]
