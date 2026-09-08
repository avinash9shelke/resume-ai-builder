"""ATS scoring endpoint."""

from typing import Any

from fastapi import APIRouter, Body

from app.models import ScoreResponse
from app.scoring import compute_score

router = APIRouter(tags=["score"])


@router.post("/score", response_model=ScoreResponse)
def score_resume(resume: dict[str, Any] = Body(...)) -> ScoreResponse:
    """Scores a resume (same JSON shape as `@resume-ai/schema`'s `Resume`)
    for ATS (Applicant Tracking System) readiness, returning an overall
    score plus a per-category breakdown with actionable suggestions."""
    return compute_score(resume)
