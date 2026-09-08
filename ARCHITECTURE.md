# System Architecture: ResumeCraft.ai

## High-Level Architecture
The system follows a **Microservices Architecture** on the backend and is designed to support a **Micro-frontend** approach on the frontend using Next.js.

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
