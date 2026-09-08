# Project Structure and Micro-Architecture

## Directory Layout
We will use a monorepo approach or separate repositories. For this setup, we'll assume a monorepo structure for clarity.

```text
/resume-ai-builder
├── apps/
│   ├── web/ (Next.js - Main Application)
│   │   ├── components/ (UI Components, DnD logic)
│   │   ├── hooks/ (AI Polish hooks, Resume state)
│   │   ├── lib/ (Schema validation, API clients)
│   │   └── pages/ (Home, Editor, Dashboard)
│   ├── ai-service/ (Python - FastAPI)
│   │   ├── agents/ (LangGraph/LangChain logic)
│   │   ├── models/ (Pydantic schemas)
│   │   └── api/ (Endpoints for parsing and polishing)
│   └── pdf-service/ (Node.js - Puppeteer)
│       ├── templates/ (HTML/Handlebars templates)
│       └── generator/ (Puppeteer logic)
├── packages/ (Shared logic)
│   ├── resume-schema/ (Shared TypeScript types and Zod schemas)
│   └── ui-core/ (Shared design system components)
└── docker-compose.yml (Orchestration for local development)
```

## Micro-frontend Strategy
- **Next.js as a Container:** The main `web` app acts as the shell.
- **Section Modules:** Different resume sections (Basics, Work, etc.) can be developed as independent modules to allow team-based scaling.
- **Deployment:** Each service (AI, PDF, Web) is containerized and deployed independently.

## Communication Pattern
- **Synchronous:** REST/gRPC between Web Shell and AI/PDF services for real-time editor feedback and export.
- **Asynchronous:** (Optional) If resume parsing takes time, use a task queue (Celery/Redis) with WebSockets to notify the user when structured data is ready.
