"""Per-session bookkeeping + AI response caching, backed by MongoDB.

Sessions are anonymous (no login) — the browser's `session_id` cookie, issued
by apps/web/src/middleware.ts, is forwarded as the `X-Session-Id` header on
every ai-service request. `touch_session` upserts a lightweight session
document; `get_cached`/`set_cached` scope AI Polish/parse results to that
same session id so repeat requests skip the LLM call.
"""

import hashlib
from datetime import datetime, timezone
from typing import Any

from fastapi import Header
from pymongo.collection import Collection

ANONYMOUS_SESSION_ID = "anonymous"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def get_session_id(
    x_session_id: str | None = Header(None, alias="X-Session-Id")
) -> str:
    """FastAPI dependency: the caller's anonymous session id, if provided."""
    return x_session_id or ANONYMOUS_SESSION_ID


def touch_session(collection: Collection, session_id: str) -> None:
    """Upserts the session's `sessions` document, bumping `last_seen_at`."""
    now = _utcnow()
    collection.update_one(
        {"_id": session_id},
        {"$set": {"last_seen_at": now}, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )


def cache_key(kind: str, session_id: str, *parts: str) -> str:
    """Deterministic id for an ai_cache document, scoped to (kind, session, parts)."""
    digest = hashlib.sha256(
        "\x1f".join([kind, session_id, *parts]).encode("utf-8")
    ).hexdigest()
    return f"{kind}:{session_id}:{digest}"


def get_cached(collection: Collection, key: str) -> dict[str, Any] | None:
    document = collection.find_one({"_id": key})
    return document["response"] if document else None


def set_cached(
    collection: Collection,
    key: str,
    session_id: str,
    kind: str,
    response: dict[str, Any],
) -> None:
    collection.update_one(
        {"_id": key},
        {
            "$set": {
                "session_id": session_id,
                "kind": kind,
                "response": response,
                "created_at": _utcnow(),
            }
        },
        upsert=True,
    )
