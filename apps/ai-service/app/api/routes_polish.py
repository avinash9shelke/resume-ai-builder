"""AI Polish endpoint (Feature 3)."""

import json

from fastapi import APIRouter, Depends
from pydantic import ValidationError
from pymongo.collection import Collection

from app.agents.polish_graph import polish_text
from app.db import get_ai_cache_collection, get_sessions_collection
from app.models.schema import PolishRequest, PolishResponse
from app.services.session_cache import (
    cache_key,
    get_cached,
    get_session_id,
    set_cached,
    touch_session,
)

router = APIRouter(prefix="/polish", tags=["polish"])


@router.post("", response_model=PolishResponse)
def polish(
    request: PolishRequest,
    session_id: str = Depends(get_session_id),
    sessions: Collection = Depends(get_sessions_collection),
    cache: Collection = Depends(get_ai_cache_collection),
) -> PolishResponse:
    touch_session(sessions, session_id)

    key = cache_key(
        "polish",
        session_id,
        request.target,
        request.text,
        json.dumps(request.context or {}, sort_keys=True),
    )
    cached = get_cached(cache, key)
    if cached is not None:
        try:
            return PolishResponse.model_validate(cached)
        except ValidationError:
            # Cached response no longer matches the current schema (e.g. after a
            # schema migration) — treat it as a cache miss and re-run instead of
            # crashing the request.
            pass

    suggestions = polish_text(request)
    response = PolishResponse(suggestions=suggestions)
    set_cached(cache, key, session_id, "polish", response.model_dump())
    return response
