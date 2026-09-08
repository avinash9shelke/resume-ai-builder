"""Upload + AI parsing endpoint (Feature 1)."""

import base64
import hashlib

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import ValidationError
from pymongo.collection import Collection

from app.agents.parser_graph import parse_resume_text
from app.config import get_settings
from app.db import get_ai_cache_collection, get_sessions_collection
from app.models.schema import ParseResumeResponse, Resume
from app.services.file_extract import (
    UnsupportedFileTypeError,
    extract_photo,
    extract_text,
)
from app.services.session_cache import (
    cache_key,
    get_cached,
    get_session_id,
    set_cached,
    touch_session,
)

router = APIRouter(prefix="/parse", tags=["parse"])


def _apply_photo(resume: Resume, photo: tuple[str, bytes] | None) -> None:
    """Populates `resume.picture.url` with the resume's embedded headshot (if
    one was found in the uploaded file), so it carries over into the new
    resume exactly like the rest of the parsed content."""
    if photo is None:
        return
    mime_type, image_bytes = photo
    resume.picture.url = (
        f"data:{mime_type};base64,{base64.b64encode(image_bytes).decode()}"
    )
    resume.picture.hidden = False


@router.post("", response_model=ParseResumeResponse)
async def parse_resume(
    file: UploadFile | None = File(None),
    text: str | None = Form(None),
    improve: bool = Form(False),
    session_id: str = Depends(get_session_id),
    sessions: Collection = Depends(get_sessions_collection),
    cache: Collection = Depends(get_ai_cache_collection),
) -> ParseResumeResponse:
    """Accepts either an uploaded resume file, or resume text pasted directly
    (e.g. from a "paste your resume" textarea) — exactly one of `file`/`text`
    is expected; whichever is provided is parsed the same way from here on."""
    touch_session(sessions, session_id)

    if file is None and not (text or "").strip():
        raise HTTPException(
            status_code=400, detail="Provide either a file or resume text to parse."
        )

    photo: tuple[str, bytes] | None = None
    if file is not None:
        settings = get_settings()
        raw_bytes = await file.read()
        max_bytes = settings.max_upload_mb * 1024 * 1024
        if len(raw_bytes) > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds {settings.max_upload_mb}MB limit",
            )
        cache_hash = hashlib.sha256(raw_bytes).hexdigest()
    else:
        raw_bytes = None
        cache_hash = hashlib.sha256((text or "").encode("utf-8")).hexdigest()

    key = cache_key("parse", session_id, cache_hash, str(improve))
    cached = get_cached(cache, key)
    if cached is not None:
        try:
            return ParseResumeResponse.model_validate(cached)
        except ValidationError:
            # Cached response no longer matches the current schema (e.g. after a
            # schema migration) — treat it as a cache miss and re-parse instead
            # of crashing the request.
            pass

    if file is not None and raw_bytes is not None:
        try:
            raw_text = extract_text(
                file.filename or "", file.content_type or "", raw_bytes
            )
        except UnsupportedFileTypeError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        photo = extract_photo(file.filename or "", file.content_type or "", raw_bytes)
    else:
        raw_text = text or ""

    if not raw_text.strip():
        fallback = Resume()
        _apply_photo(fallback, photo)
        return ParseResumeResponse(
            resume=fallback,
            incomplete=True,
            warnings=[
                "Could not extract any text from the file. Please fill in manually."
            ],
        )

    result = parse_resume_text(raw_text, improve=improve)
    resume = result["resume"]
    _apply_photo(resume, photo)
    response = ParseResumeResponse(
        resume=resume,
        incomplete=result.get("incomplete", False),
        warnings=result.get("warnings", []),
    )
    if not response.incomplete:
        set_cached(cache, key, session_id, "parse", response.model_dump())
    return response
