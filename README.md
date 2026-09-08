# ResumeCraft.ai

This project is an AI-powered resume builder following the JSON Resume Schema standard.

## Documentation
- [Requirements](REQUIREMENTS.md)
- [Architecture](ARCHITECTURE.md)
- [Schema Mapping](SCHEMA_MAPPING.md)
- [Project Structure](STRUCTURE.md)

## Tech Stack
- **Frontend:** Next.js, Tailwind CSS, dnd-kit
- **Backend:** Python (FastAPI), LangChain, LangGraph, Pydantic
- **PDF Generation:** Puppeteer (Node.js)

## Project Layout
```
apps/
  web/           Next.js app (UI + lightweight API gateway under src/app/api)
  ai-service/    FastAPI service (resume CRUD, LangGraph parsing + AI Polish)
  pdf-service/   Express + Puppeteer service (renders resume JSON to PDF)
packages/
  resume-schema/ Shared Zod (TS) schema, mirrored by Pydantic models in ai-service
  ui-core/       Shared design-system React components
```

## Getting Started

### Run everything with Docker Compose (recommended)
```bash
cp apps/ai-service/.env.example apps/ai-service/.env   # add OPENAI_API_KEY to enable AI features
docker compose up --build
```
- Web app: http://localhost:3000
- AI service: http://localhost:8000 (docs at /docs)
- PDF service: http://localhost:4000

Without an `OPENAI_API_KEY`, resume parsing and AI Polish still run end-to-end but
fall back to empty/original text instead of calling OpenAI.

### Run services individually (local development)
```bash
# 1. Shared packages (build once, or `npm run dev` in each to watch)
npm install
npm run build:schema

# 2. ai-service (Python 3.12)
cd apps/ai-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env   # set OPENAI_API_KEY; MONGODB_URL defaults to local MongoDB
uvicorn app.main:app --reload

# 3. pdf-service
cd apps/pdf-service
npm run dev

# 4. web
cd apps/web
cp .env.example .env.local
npm run dev
```
A local MongoDB instance is required for ai-service (`docker compose up mongo` is the easiest way to get one).

## Testing & Linting
```bash
# ai-service
cd apps/ai-service && source .venv/bin/activate
pytest tests/ -v
black --check app/ && flake8 app/

# pdf-service
npm run test --workspace=apps/pdf-service
npm run build --workspace=apps/pdf-service

# web
npm run test --workspace=apps/web
npm run lint --workspace=apps/web
npm run build --workspace=apps/web
```
