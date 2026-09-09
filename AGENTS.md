# Agent Notes: resume-ai-builder

## Layout
- `apps/web` — Next.js 14 (App Router, TS, Tailwind). Also hosts the lightweight
  API gateway (`src/app/api/*`) that proxies to ai-service/pdf-service/ats-service.
- `apps/ai-service` — FastAPI + PyMongo (MongoDB) + LangChain/LangGraph (Python 3.12).
- `apps/pii-data-service` — FastAPI + Presidio (PII detection) + Redis
  (mask <-> original-value mapping store), Python 3.12. Called by
  `ai-service`'s parser graph (`mask`/`unmask` nodes) to anonymize
  personal-identity text before it reaches the LLM, then rehydrate it in
  the final response. See ARCHITECTURE.md's PII masking pipeline diagram.
- `apps/ats-service` — FastAPI, Python 3.12, no DB. Rule-based (not LLM-based)
  ATS score calculator (`app/scoring.py`) — accepts a Resume JSON `dict` and
  returns an overall score + per-category breakdown/suggestions/`sectionId`.
  See ARCHITECTURE.md section 5.
- `apps/pdf-service` — Express + Puppeteer + Handlebars (Node/TS).
- `packages/resume-schema` — Zod schema (source of truth for the JSON Resume
  shape used by web/pdf-service). Must stay structurally in sync with the
  Pydantic models in `apps/ai-service/app/models/schema.py`.
- `packages/ui-core` — shared React design-system primitives (Button, Card, TextField).

npm workspaces are used at the repo root; `packages/resume-schema` and
`packages/ui-core` must be built (`npm run build:schema` from repo root)
before `apps/web` or `apps/pdf-service` can resolve them.

## Build / Test / Lint
- Root: `npm install`, `npm run build:schema`
- web: `npm run build --workspace=apps/web`, `npm run lint --workspace=apps/web`,
  `npm run test --workspace=apps/web` (vitest)
- pdf-service: `npm run build --workspace=apps/pdf-service`,
  `npm run test --workspace=apps/pdf-service` (vitest + supertest, puppeteer is mocked in tests)
- ai-service (from `apps/ai-service`, with `.venv` activated):
  `pytest tests/ -v`, `black app/`, `flake8 app/ --max-line-length=110 --extend-ignore=E203`
  Tests use `mongomock` (in-memory MongoDB, see `tests/conftest.py`), not a real Mongo server.
  ai-service's own tests mock `pii_client` — they don't call pii-data-service over HTTP.
- pii-data-service (from `apps/pii-data-service`, needs a **Python 3.12** venv —
  spaCy's `blis` dependency has no prebuilt wheels for newer Python yet):
  `python -m spacy download en_core_web_sm` once after installing requirements,
  then `pytest tests/ -v`, `black app/`, `flake8 app/ --max-line-length=110 --extend-ignore=E203`.
  Tests use `fakeredis` (see `tests/conftest.py`), not a real Redis server.
- ats-service (from `apps/ats-service`, needs a **Python 3.12** venv — the
  system default Python may be too new for pydantic-core's prebuilt wheel):
  `pytest tests/ -v`, `black app/`, `flake8 app/ --max-line-length=110 --extend-ignore=E203`.
  No DB/external services to mock — pure functions in `app/scoring.py`.

## Docker / Deployment
- All five apps are built into **one** image from the root `Dockerfile` and
  run as sibling processes in one container via `docker/supervisord.conf`
  (`web` on `$PORT`; `ai-service`/`pii-data-service`/`ats-service`/
  `pdf-service` on fixed `127.0.0.1` ports 8000/8100/8200/4000). This is what
  lets the whole thing deploy as a single Render "Web Service" — see
  `render.yaml` and the "Deployment Topology" section of ARCHITECTURE.md.
  There are no more per-app Dockerfiles under `apps/*`.
- `docker compose up --build` now runs just `mongo`, `redis`, and `app`
  (the one consolidated image) for local dev/integration testing.
- The runtime image installs a system `chromium` package and sets
  `PUPPETEER_SKIP_DOWNLOAD`/`PUPPETEER_EXECUTABLE_PATH` — Puppeteer's bundled
  Chromium download does not support linux/arm64, which matters on Apple Silicon.
- The three Python services (`ai-service`, `ats-service`, `pii-data-service`)
  are each installed into their own dedicated `python:3.12-slim-bookworm`
  build stage (pinned to `-bookworm` to match `node:20-slim`'s glibc — the
  untagged `python:3.12-slim` moved to a newer Debian base with an
  incompatible glibc), then that whole stage's `/usr/local` (interpreter +
  stdlib + libpython + site-packages) is copied into the final
  `node:20-slim`-based runtime stage at `/opt/py-ai`, `/opt/py-ats`,
  `/opt/py-pii` respectively, to avoid dependency conflicts between e.g.
  LangChain and Presidio/spaCy while still ending up in one image.
- For a real deploy, MongoDB and Redis must be external since Render web
  service containers are ephemeral. `render.yaml` self-hosts *both* as
  their own Render services (`type: pserv`) running the official `mongo`
  and `redis` images directly — not MongoDB Atlas or Render's managed Key
  Value product. `resume-ai-builder-mongo` has a persistent Disk attached
  (`resume-ai-builder-redis` doesn't need one — it only backs a short-TTL
  cache). Both are reachable from the web service only over Render's
  private network, at `mongodb://resume-ai-builder-mongo:27017` and
  `redis://resume-ai-builder-redis:6379/0`.

## Notes
- No login/auth is implemented; anonymous per-browser sessions are tracked
  via a `session_id` cookie (see `apps/web/src/middleware.ts`) forwarded to
  ai-service as `X-Session-Id`, used to scope the MongoDB `sessions`/`ai_cache` collections.
- AI Polish / parsing gracefully degrade when `OPENAI_API_KEY` is unset
  (polish pads with the original text; parsing returns an empty/incomplete resume).
- Resume parsing also gracefully degrades if `pii-data-service` is unreachable:
  masking/unmasking becomes a no-op (raw text goes to the LLM unmasked)
  rather than failing the request — see `apps/ai-service/app/services/pii_client.py`.
