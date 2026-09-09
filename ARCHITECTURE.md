# System Architecture: ResumeCraft.ai

## Deployment Topology
The five apps below are developed as separate codebases under `apps/*`
(each still has its own FastAPI/Express app, own tests, own `AGENTS.md`
build/test commands), but are no longer *deployed* as separate
microservices/containers. They're built into a **single Docker image** (see
the root `Dockerfile`) and run as sibling processes inside **one container**,
supervised by `docker/supervisord.conf`:

| Process           | Bind address       | Reachable from                         |
|--------------------|---------------------|-----------------------------------------|
| `web` (Next.js)   | `0.0.0.0:$PORT`     | Externally (this is the only port Render/the container exposes) |
| `ai-service`      | `127.0.0.1:8000`    | Only `web`, inside the container        |
| `pii-data-service`| `127.0.0.1:8100`    | Only `ai-service`, inside the container |
| `ats-service`     | `127.0.0.1:8200`    | Only `web`, inside the container        |
| `pdf-service`     | `127.0.0.1:4000`    | Only `web`, inside the container        |

This is what lets the whole app deploy as a single Render "Web Service"
(Render only routes external traffic to one container/one port per service).
The former docker-compose service-discovery hostnames (`ai-service`,
`pdf-service`, etc.) are gone — each app's `*_SERVICE_URL`/`*_URL` env var
now defaults to `127.0.0.1`/`localhost` at its fixed port instead, and the
HTTP contracts between them are otherwise unchanged (`web`'s API routes
still proxy JSON/multipart over HTTP to the others; `ai-service`'s
`pii_client.py` still calls `pii-data-service`'s `/mask` and `/unmask`).
Local development can still run everything via `docker-compose up --build`
(now just `app` + `mongo` + `redis`), or each app individually as before
(`npm run dev:web`, `uvicorn app.main:app`, ...) pointed at each other via
the same env vars.

MongoDB and Redis are **not** bundled into the app image — a Render web
service's container is ephemeral/stateless, so both must be externally
hosted. `render.yaml` self-hosts *both* as their own Render "Private
Services" (`resume-ai-builder-mongo` running the official `mongo` image
with a persistent Disk; `resume-ai-builder-redis` running `redis:7-alpine`,
no disk needed since it only backs a short-TTL cache) rather than
Render-managed database/Key Value products. The web service reaches them
over Render's private network at `mongodb://resume-ai-builder-mongo:27017`
and `redis://resume-ai-builder-redis:6379/0` - those hostnames are only
resolvable/reachable from other services in the same Render project, not
publicly.

## High-Level Architecture
The system is internally organized as a set of loosely-coupled
service-like modules (each with its own FastAPI/Express app and HTTP API),
but — per the Deployment Topology above — is packaged and deployed as a
single service, not as independently-deployed microservices/micro-frontends.

### 1. Frontend (Next.js)
- **Framework:** Next.js (App Router).
- **State Management:** Zustand or React Context for resume data.
- **UI Components:** Tailwind CSS + Headless UI / Radix UI.
- **Drag and Drop:** `@dnd-kit/core` and `@dnd-kit/sortable`.
- **Forms:** React Hook Form + Zod.
- **Inter-module Communication:** Custom events or a shared state if using multiple micro-frontends.

### 2. Backend Services (Python)
- **API Framework:** FastAPI (chosen for its speed and native Pydantic support).
- **Orchestration:** LangGraph to manage complex AI workflows (Parsing -> Structuring -> Polishing).
- **AI Integration:** LangChain for interfacing with LLMs (OpenAI, Anthropic, or local models).
- **Data Validation:** Pydantic models matching the JSON Resume Schema.

### 3. PDF Generation Service (Node.js)
- **Library:** Puppeteer.
- **Flow:** 
    1. Receives JSON Resume data.
    2. Renders a Tailwind-styled HTML template.
    3. Generates PDF buffer and returns it or uploads to S3.

### 4. Database & Storage
- **Database:** MongoDB — each resume is stored as a single document (`resumes` collection), a natural fit for the flexible JSON Resume shape.
- **Cache / Ephemeral Store:** Redis — backs `pii-data-service`'s mask <-> original-value mappings (short TTL, only needs to outlive one parse request) and `ai-service`'s per-session AI response cache.
- **Object Storage:** AWS S3 or equivalent for profile photos and generated PDFs.

### 5. ATS Score Service (Python) — `apps/ats-service`
A standalone microservice that scores a resume's ATS (Applicant Tracking
System) readiness. Deliberately **rule-based rather than LLM-based**
(`app/scoring.py`) — scoring is fast, free, deterministic, and reproducible.
Accepts the same JSON shape as `@resume-ai/schema`'s `Resume` type as a plain
`dict` (rather than duplicating that schema a third time) and returns an
overall 0-100 score plus a weighted breakdown across six categories (contact
info, summary, experience impact, skills, education, length/structure), each
with actionable suggestions and the `sectionId` to highlight in the editor.
The web app's `AtsScorePanel` component surfaces this, highlighting weak
sections in the editor and linking each into that section's existing AI
Polish button.

### 6. PII Data Service (Python) — `apps/pii-data-service`
A dedicated microservice fronting the PII Masking/Unmasking pipeline (see
below), kept separate from `ai-service` so PII detection logic and its
Redis-backed mapping store have their own deployable, independently
scalable unit.
- **PII Detection:** Microsoft Presidio (`presidio-analyzer` + spaCy NLP
  engine) recognizes `PERSON`, `EMAIL_ADDRESS`, `PHONE_NUMBER`, and
  `LOCATION` entities. `DATE_TIME`/`ORGANIZATION` are deliberately left
  unmasked — the LLM still needs real dates/company names to correctly
  extract employment history.
- **Masking:** each distinct detected value gets a stable placeholder token
  (e.g. `<PERSON_1>`); repeated mentions of the same value reuse it.
- **Mapping storage:** `placeholder -> original value` is stored in Redis
  under a generated `mapping_id`, with a short TTL (default 10 minutes —
  only needs to survive one mask -> LLM -> unmask round trip).
- **Endpoints:** `POST /mask` (text -> masked text + mapping_id),
  `POST /unmask` (mapping_id + arbitrary JSON -> the same JSON with every
  placeholder recursively rehydrated back to its real value).

---

## AI Workflow (LangGraph)
The AI interactions are handled by stateful graphs. The resume-parsing graph
implements the PII-masking pipeline end to end:

```
[User Resume Text]
       │
       ▼
[PII Masking & Anonymization Engine (Presidio)] ──(Store Mapping)──► [Redis Cache]
       │                                                                  │
  (Masked Text)                                                          │
       ▼                                                                  │
[AI Improvement Agent (LLM)]                                             │
       │                                                                  │
 (JSON Response)                                                         │
       ▼                                                                  │
[Unmasking & Hydration Service] ◄─────────────────────────────────────────┘
       │
       ▼
[Final JSON Resume mapped to UI Components]
```

Nodes, per `apps/ai-service/app/agents/parser_graph.py`:
1. **Node 1: Mask** - Calls `pii-data-service`'s `/mask` to anonymize
   personal-identity text before anything reaches the LLM. Degrades
   gracefully (passes raw text through unmasked) if the service is down.
2. **Node 2: Structurer** - Maps the *masked* text to `json-resume-schema` via the LLM.
3. **Node 3: Validator** - Ensures the output matches the required schema using Pydantic.
4. **Node 4: Unmask** - Calls `pii-data-service`'s `/unmask` to rehydrate PII
   placeholders throughout the validated Resume's JSON back to real values.

A separate polish graph (unaffected by masking, since it only ever sees text
the user already pasted into the editor, not an uploaded raw document):
1. **Polisher** - Takes a section and generates 5 variations based on industry standards.
2. **Validator** - Ensures exactly 5 distinct, non-empty suggestions.

## Data Flow Diagram (Conceptual)
`User -> Frontend (Next.js) -> API Gateway -> [AI Service (Python) [-> PII Data Service (Python)] | PDF Service (Node.js)]`
