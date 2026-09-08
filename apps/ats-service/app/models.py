"""Response models for the ATS scoring API.

The request body is intentionally accepted as a plain `dict` (see
app/api/routes_score.py) rather than a strict schema: it's the same JSON
shape as `@resume-ai/schema`'s `Resume` type, which lives in the web app and
has churned through several migrations already — duplicating that whole
schema a third time here would just be another thing to keep in sync. The
scoring engine (app/scoring.py) reads fields defensively instead.
"""

from typing import Literal

from pydantic import BaseModel, Field

Status = Literal["good", "warning", "critical"]


class CategoryResult(BaseModel):
    id: str
    label: str
    score: int  # 0-100
    weight: int  # this category's contribution toward the overall score
    status: Status
    message: str
    suggestions: list[str] = Field(default_factory=list)
    # The resume section this category maps to (e.g. "experience", "skills"),
    # used by the frontend to highlight the section that needs attention.
    # `None` for whole-resume checks that aren't tied to one section.
    sectionId: str | None = None


class ScoreResponse(BaseModel):
    overallScore: int
    categories: list[CategoryResult]
    # Convenience list of every sectionId whose category isn't "good", so
    # the frontend doesn't need to re-derive it from `categories`.
    highlightedSections: list[str]
