# Single-image monolith build for deployment as ONE Render web service.
#
# Historically each app under apps/* was built + deployed as its own
# container (see git history for the old per-app Dockerfiles / docker-compose
# network). That microservice-per-container pattern doesn't map onto a
# platform like Render's free/simple "Web Service" primitive, which expects
# a single container listening on a single $PORT.
#
# This image instead bundles all five apps into one container and runs them
# as sibling processes supervised by `supervisord` (see docker/supervisord.conf):
#   - web (Next.js)        -> binds $PORT, the only port Render routes to
#   - ai-service (FastAPI) -> 127.0.0.1:8000
#   - pii-data-service     -> 127.0.0.1:8100
#   - ats-service (FastAPI)-> 127.0.0.1:8200
#   - pdf-service (Express)-> 127.0.0.1:4000
# The Next.js API routes (the former "API gateway") and ai-service's
# pii_client already talk to the others over plain HTTP using configurable
# *_SERVICE_URL / *_URL env vars, so no application code needed to change to
# go from "separate hosts on a docker network" to "separate ports on
# localhost inside one container" - see docker/env.defaults.

# ---------------------------------------------------------------------------
# Stage: web (Next.js) build
# ---------------------------------------------------------------------------
FROM node:20-slim AS web-builder
WORKDIR /workspace

COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY apps/pdf-service/package.json apps/pdf-service/package.json
COPY packages/resume-schema packages/resume-schema
COPY packages/ui-core packages/ui-core
RUN npm install --workspace=apps/web --workspace=apps/pdf-service \
      --workspace=packages/resume-schema --workspace=packages/ui-core

WORKDIR /workspace/packages/resume-schema
RUN npm run build
WORKDIR /workspace/packages/ui-core
RUN npm run build

WORKDIR /workspace/apps/web
COPY apps/web ./
RUN npm run build

# ---------------------------------------------------------------------------
# Stage: pdf-service (Puppeteer/Handlebars) build
# ---------------------------------------------------------------------------
FROM node:20-slim AS pdf-builder
WORKDIR /workspace

COPY package.json package-lock.json* ./
COPY apps/pdf-service/package.json apps/pdf-service/package.json
COPY packages/resume-schema packages/resume-schema
RUN npm install --workspace=apps/pdf-service --workspace=packages/resume-schema

WORKDIR /workspace/packages/resume-schema
RUN npm run build

WORKDIR /workspace/apps/pdf-service
COPY apps/pdf-service/tsconfig.json ./tsconfig.json
COPY apps/pdf-service/src ./src
RUN npx tsc -p tsconfig.json && mkdir -p dist/templates && cp -R src/templates/. dist/templates/
RUN npm prune --omit=dev

# ---------------------------------------------------------------------------
# Stage: ai-service (FastAPI + LangChain/LangGraph + PyMongo)
#
# Rather than a `python -m venv`, each Python service installs straight
# into its own build stage's `/usr/local` (i.e. the whole interpreter +
# stdlib + libpython + site-packages, self-contained) and that entire tree
# gets copied into the final image below - a bare venv's copied interpreter
# still dynamically depends on the stdlib/libpython living at fixed absolute
# paths that don't exist in the node:20-slim runtime image, whereas copying
# the whole `/usr/local` keeps every one of those paths intact.
# ---------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS py-ai
COPY apps/ai-service/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# ---------------------------------------------------------------------------
# Stage: ats-service (FastAPI, pure rule-based scoring, no extra deps)
# ---------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS py-ats
COPY apps/ats-service/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# ---------------------------------------------------------------------------
# Stage: pii-data-service (FastAPI + Presidio + spaCy model)
# ---------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS py-pii
RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY apps/pii-data-service/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt \
    && python -m spacy download en_core_web_sm

# ---------------------------------------------------------------------------
# Final runtime image: Node (for web + pdf-service) + the three self-contained
# Python installs + Chromium (Puppeteer) + supervisord (process supervisor
# for all 5 processes)
# ---------------------------------------------------------------------------
FROM node:20-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium ca-certificates fonts-liberation supervisor curl \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=3000 \
    AI_SERVICE_URL=http://127.0.0.1:8000 \
    PDF_SERVICE_URL=http://127.0.0.1:4000 \
    ATS_SERVICE_URL=http://127.0.0.1:8200 \
    PII_SERVICE_URL=http://127.0.0.1:8100

WORKDIR /app

# --- web (Next.js) ---
# npm workspaces hoist deps to the workspace root's node_modules and
# symlink workspace packages (@resume-ai/schema, @resume-ai/ui-core) into it
# with relative paths like `../../packages/resume-schema` (two levels up
# from `<workspace-root>/node_modules/@resume-ai/`) - so each service needs
# its *own* `packages/` sitting two levels above its own `node_modules`, at
# `./<service>/packages/...`, for those symlinks to resolve.
COPY --from=web-builder /workspace/apps/web/.next ./web/.next
COPY --from=web-builder /workspace/apps/web/public ./web/public
COPY --from=web-builder /workspace/apps/web/package.json ./web/package.json
COPY --from=web-builder /workspace/node_modules ./web/node_modules
COPY --from=web-builder /workspace/packages/resume-schema ./web/packages/resume-schema
COPY --from=web-builder /workspace/packages/ui-core ./web/packages/ui-core

# --- pdf-service (Express + Puppeteer) ---
COPY --from=pdf-builder /workspace/apps/pdf-service/dist ./pdf-service/dist
COPY --from=pdf-builder /workspace/apps/pdf-service/package.json ./pdf-service/package.json
COPY --from=pdf-builder /workspace/node_modules ./pdf-service/node_modules
COPY --from=pdf-builder /workspace/packages/resume-schema ./pdf-service/packages/resume-schema

# --- ai-service (FastAPI) ---
COPY --from=py-ai /usr/local /opt/py-ai
COPY apps/ai-service/app ./ai-service/app

# --- ats-service (FastAPI) ---
COPY --from=py-ats /usr/local /opt/py-ats
COPY apps/ats-service/app ./ats-service/app

# --- pii-data-service (FastAPI) ---
COPY --from=py-pii /usr/local /opt/py-pii
COPY apps/pii-data-service/app ./pii-service/app

COPY docker/supervisord.conf /etc/supervisor/supervisord.conf

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${PORT}/" || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
