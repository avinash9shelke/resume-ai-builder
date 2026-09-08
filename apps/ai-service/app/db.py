from functools import lru_cache

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

from app.config import get_settings


@lru_cache
def get_client() -> MongoClient:
    settings = get_settings()
    # Short server-selection timeout so the app/tests fail fast (rather than
    # blocking on PyMongo's 30s default) when Mongo isn't reachable yet.
    return MongoClient(settings.mongodb_url, serverSelectionTimeoutMS=2000)


def get_database() -> Database:
    settings = get_settings()
    return get_client()[settings.mongodb_db_name]


def get_resumes_collection() -> Collection:
    """FastAPI dependency yielding the `resumes` collection."""
    return get_database()["resumes"]


@lru_cache
def get_sessions_collection() -> Collection:
    """FastAPI dependency yielding the `sessions` collection.

    Tracks one document per anonymous browser session (see
    apps/web/src/middleware.ts), so it's cheap to scope things like the AI
    response cache to "this browser" without requiring login.
    """
    collection = get_database()["sessions"]
    try:
        # Idle sessions (no requests for 30 days) are pruned automatically.
        collection.create_index("last_seen_at", expireAfterSeconds=60 * 60 * 24 * 30)
    except Exception:  # noqa: BLE001 - index creation is best-effort
        pass
    return collection


@lru_cache
def get_ai_cache_collection() -> Collection:
    """FastAPI dependency yielding the `ai_cache` collection.

    Caches AI Polish suggestions and resume-parse results per session, so
    repeating the same request (same text/file + session) skips the LLM call.
    Entries expire automatically after AI_CACHE_TTL_SECONDS (see config.py).
    """
    settings = get_settings()
    collection = get_database()["ai_cache"]
    try:
        collection.create_index(
            "created_at", expireAfterSeconds=settings.ai_cache_ttl_seconds
        )
    except Exception:  # noqa: BLE001 - index creation is best-effort
        pass
    return collection
