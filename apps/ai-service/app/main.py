from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import routes_parse, routes_polish, routes_resumes
from app.config import get_settings

settings = get_settings()

# No explicit startup connection/ping: MongoClient connects lazily on first
# operation, so the app boots fine even if MongoDB isn't reachable yet.
app = FastAPI(title="ResumeCraft.ai - AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_resumes.router)
app.include_router(routes_parse.router)
app.include_router(routes_polish.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
