"""LangGraph workflow for Feature 1 (Resume Upload and Parsing).

Nodes, per ARCHITECTURE.md's PII-masking pipeline:
  1. Mask       - PII Masking & Anonymization Engine: masks personal-identity
                  text (name/email/phone/location) via pii-data-service
                  before anything reaches the LLM.
  2. Structurer - maps the *masked* resume text to the resume schema via
                  the LLM ("AI Improvement Agent").
  3. Validator  - ensures the output matches the Pydantic schema, falling back
                  to an (incomplete) empty resume so the UI can drop to manual
                  entry rather than hard-failing.
  4. Unmask     - Unmasking & Hydration Service: rehydrates PII placeholders
                  in the LLM's JSON response back to their real values.

(Text extraction - "Parser" in ARCHITECTURE.md - happens upstream in
app/services/file_extract.py before this graph runs.)
"""

import logging
from typing import TypedDict

from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field, ValidationError

from app.agents.llm import get_llm
from app.services import pii_client
from app.models.schema import (
    BULLET_PREFIXES,
    AwardsSection,
    CertificationsSection,
    EducationSection,
    ExperienceSection,
    InterestItem,
    InterestsSection,
    LanguageItem,
    LanguagesSection,
    ProjectsSection,
    PublicationsSection,
    ReferencesSection,
    Resume,
    Sections,
    SkillItem,
    SkillsSection,
    Summary,
    VolunteerSection,
    Website,
    richtext_from_plain,
)

logger = logging.getLogger(__name__)

STRUCTURING_PROMPT = """You are an expert resume parser. Read the resume text \
below and extract every relevant detail into the structured schema provided. \
Preserve the original wording exactly — do not rewrite, rephrase, or embellish \
any text. If a field is not present in the source text, leave it empty rather \
than inventing information.

BULLET POINTS: if a description (work experience, project, award, etc.) or \
the summary consists of multiple lines, and any of those lines already start \
with "• " in the source text, keep every one of those lines on its own line \
in your output, each still starting with "• " — never merge bullets into a \
single paragraph, never drop the "• " marker, and never add "• " to a line \
that didn't already have it in the source text.

Resume text:
---
{raw_text}
---
"""

# Used for the "Improve with AI" processing option: still extracts strictly
# accurate facts (dates, names, titles), but also refines the summary and
# bullet points, per the resume-writer/ATS-optimization brief.
IMPROVING_STRUCTURING_PROMPT = """You are an expert resume writer and ATS \
optimization specialist. Read the resume text below and extract every \
relevant detail into the structured schema provided.

Instructions:
1. Extract all personal information, experience, education, skills, projects, \
and custom sections.
2. Refine the summary and bullet points: enhance action verbs, correct \
grammar, and quantify achievements where possible.
3. Preserve strictly accurate dates, company names, titles, and institutions — \
do not invent fictional information.
4. If a description or the summary consists of multiple lines, and any of \
those lines already start with "• " in the source text, keep every one of \
those lines on its own line in your rewritten output, each still starting \
with "• " — never merge bullets into a single paragraph and never drop the \
"• " marker.

Resume text:
---
{raw_text}
---
"""


# Structured-output target for the LLM: identical to the real schema, except
# long-text fields (summary/description) are plain strings rather than rich
# text entries — asking the LLM to invent entry ids/HTML markup directly is
# unreliable. `_to_resume` below converts these into RichText entries.
class _LLMBasics(BaseModel):
    name: str = ""
    headline: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    website: Website = Field(default_factory=Website)


class _LLMSummary(BaseModel):
    content: str = ""


class _LLMExperienceItem(BaseModel):
    company: str = ""
    position: str = ""
    location: str = ""
    period: str = ""
    website: Website = Field(default_factory=Website)
    description: str = ""


class _LLMEducationItem(BaseModel):
    school: str = ""
    degree: str = ""
    area: str = ""
    grade: str = ""
    location: str = ""
    period: str = ""
    website: Website = Field(default_factory=Website)


class _LLMProjectItem(BaseModel):
    name: str = ""
    period: str = ""
    website: Website = Field(default_factory=Website)
    description: str = ""


class _LLMAwardItem(BaseModel):
    title: str = ""
    awarder: str = ""
    date: str = ""
    website: Website = Field(default_factory=Website)
    description: str = ""


class _LLMCertificationItem(BaseModel):
    title: str = ""
    issuer: str = ""
    date: str = ""
    website: Website = Field(default_factory=Website)
    description: str = ""


class _LLMPublicationItem(BaseModel):
    title: str = ""
    publisher: str = ""
    date: str = ""
    website: Website = Field(default_factory=Website)
    description: str = ""


class _LLMVolunteerItem(BaseModel):
    organization: str = ""
    location: str = ""
    period: str = ""
    website: Website = Field(default_factory=Website)
    description: str = ""


class _LLMReferenceItem(BaseModel):
    name: str = ""
    position: str = ""
    website: Website = Field(default_factory=Website)
    phone: str = ""
    description: str = ""


class _LLMSections(BaseModel):
    experience: list[_LLMExperienceItem] = Field(default_factory=list)
    education: list[_LLMEducationItem] = Field(default_factory=list)
    projects: list[_LLMProjectItem] = Field(default_factory=list)
    skills: list[SkillItem] = Field(default_factory=list)
    languages: list[LanguageItem] = Field(default_factory=list)
    interests: list[InterestItem] = Field(default_factory=list)
    awards: list[_LLMAwardItem] = Field(default_factory=list)
    certifications: list[_LLMCertificationItem] = Field(default_factory=list)
    publications: list[_LLMPublicationItem] = Field(default_factory=list)
    volunteer: list[_LLMVolunteerItem] = Field(default_factory=list)
    references: list[_LLMReferenceItem] = Field(default_factory=list)


class _LLMResume(BaseModel):
    title: str = "Untitled Resume"
    basics: _LLMBasics = Field(default_factory=_LLMBasics)
    summary: _LLMSummary = Field(default_factory=_LLMSummary)
    sections: _LLMSections = Field(default_factory=_LLMSections)


def _to_resume(llm_resume: _LLMResume) -> Resume:
    s = llm_resume.sections
    return Resume(
        title=llm_resume.title,
        basics=llm_resume.basics.model_dump(),
        summary=Summary(content=richtext_from_plain(llm_resume.summary.content)),
        sections=Sections(
            experience=ExperienceSection(
                items=[
                    {
                        **e.model_dump(exclude={"description"}),
                        "description": richtext_from_plain(e.description),
                    }
                    for e in s.experience
                ]
            ),
            education=EducationSection(items=[e.model_dump() for e in s.education]),
            projects=ProjectsSection(
                items=[
                    {
                        **p.model_dump(exclude={"description"}),
                        "description": richtext_from_plain(p.description),
                    }
                    for p in s.projects
                ]
            ),
            skills=SkillsSection(items=s.skills),
            languages=LanguagesSection(items=s.languages),
            interests=InterestsSection(items=s.interests),
            awards=AwardsSection(
                items=[
                    {
                        **a.model_dump(exclude={"description"}),
                        "description": richtext_from_plain(a.description),
                    }
                    for a in s.awards
                ]
            ),
            certifications=CertificationsSection(
                items=[
                    {
                        **c.model_dump(exclude={"description"}),
                        "description": richtext_from_plain(c.description),
                    }
                    for c in s.certifications
                ]
            ),
            publications=PublicationsSection(
                items=[
                    {
                        **p.model_dump(exclude={"description"}),
                        "description": richtext_from_plain(p.description),
                    }
                    for p in s.publications
                ]
            ),
            volunteer=VolunteerSection(
                items=[
                    {
                        **v.model_dump(exclude={"description"}),
                        "description": richtext_from_plain(v.description),
                    }
                    for v in s.volunteer
                ]
            ),
            references=ReferencesSection(
                items=[
                    {
                        **r.model_dump(exclude={"description"}),
                        "description": richtext_from_plain(r.description),
                    }
                    for r in s.references
                ]
            ),
        ),
    )


class ParserState(TypedDict, total=False):
    raw_text: str
    improve: bool
    masked_text: str
    mapping_id: str | None
    resume: Resume
    incomplete: bool
    warnings: list[str]


def mask_node(state: ParserState) -> ParserState:
    """PII Masking & Anonymization Engine: replaces personal-identity text
    (name/email/phone/location) with placeholder tokens before the LLM ever
    sees it. `mapping_id` is None if pii-data-service is unreachable, in
    which case the raw text is passed through unmasked (see pii_client)."""
    masked_text, mapping_id = pii_client.mask(state["raw_text"])
    return {"masked_text": masked_text, "mapping_id": mapping_id}


# Keyword heuristics used to guess which sections the source text actually
# has, so a structuring attempt that comes back with an empty list for one of
# them can be told apart from "the resume genuinely has no awards" (see
# `_missing_sections`/_MAX_STRUCTURE_ATTEMPTS below).
_SECTION_KEYWORDS: dict[str, str] = {
    "education": "education",
    "skills": "skill",
    "awards": "award",
    "certifications": "certificat",
    "publications": "publication",
    "volunteer": "volunteer",
    "references": "reference",
    "projects": "project",
}

# On any single attempt the model (especially a smaller/cheaper one, e.g.
# `OPENAI_MODEL=gpt-5-nano`) sometimes drops one or more whole sections from
# its structured output even though the source text clearly contains them
# (observed on real multi-section resumes exported from templates that pack
# everything — experience, education, skills, certifications, awards — into
# a single call). Retrying and merging in whatever new sections each attempt
# recovers is much more reliable than a single shot.
_MAX_STRUCTURE_ATTEMPTS = 3


_MAX_HEADER_LINE_LENGTH = 40


def _mentioned_sections(text: str) -> set[str]:
    """Only checks short, header-like lines (e.g. "EDUCATION",
    "CERTIFICATIONS / COURSES") rather than the whole text — several of these
    keywords ("project", "skill") are common enough in ordinary sentences
    (e.g. "delivered the project on time") that a plain substring search
    across the whole resume would trigger false positives and cause
    pointless retries for sections the resume doesn't actually have."""
    mentioned: set[str] = set()
    for line in text.splitlines():
        stripped = line.strip().lower()
        if not stripped or len(stripped) > _MAX_HEADER_LINE_LENGTH:
            continue
        for key, keyword in _SECTION_KEYWORDS.items():
            if keyword in stripped:
                mentioned.add(key)
    return mentioned


def _missing_sections(resume: _LLMResume, text: str) -> set[str]:
    """Sections whose keyword appears in the source text but that the model
    returned as empty — candidates for recovery on a retry."""
    return {
        key for key in _mentioned_sections(text) if not getattr(resume.sections, key)
    }


def _merge_llm_resumes(base: _LLMResume, extra: _LLMResume) -> _LLMResume:
    """Fills in any section/basics/summary fields still empty in `base` using
    values from a later retry attempt."""
    merged_sections = base.sections.model_copy()
    for field_name in type(merged_sections).model_fields:
        if not getattr(merged_sections, field_name) and getattr(
            extra.sections, field_name
        ):
            setattr(merged_sections, field_name, getattr(extra.sections, field_name))

    basics = base.basics if (base.basics.name or base.basics.email) else extra.basics
    summary = base.summary if base.summary.content else extra.summary
    title = (
        base.title if base.title and base.title != "Untitled Resume" else extra.title
    )

    return _LLMResume(
        title=title, basics=basics, summary=summary, sections=merged_sections
    )


def structure_node(state: ParserState) -> ParserState:
    llm = get_llm(temperature=0)
    structured_llm = llm.with_structured_output(_LLMResume)
    template = (
        IMPROVING_STRUCTURING_PROMPT if state.get("improve") else STRUCTURING_PROMPT
    )
    text_for_llm = state.get("masked_text") or state["raw_text"]
    prompt = template.format(raw_text=text_for_llm)

    merged: _LLMResume | None = None
    warnings: list[str] = []
    for attempt in range(_MAX_STRUCTURE_ATTEMPTS):
        try:
            llm_resume = structured_llm.invoke(prompt)
        except Exception as exc:  # noqa: BLE001 - try again, or fall back below
            logger.warning(
                "AI structuring LLM call failed on attempt %d",
                attempt + 1,
                exc_info=True,
            )
            warnings.append(f"AI structuring failed: {exc}")
            continue

        merged = (
            llm_resume if merged is None else _merge_llm_resumes(merged, llm_resume)
        )

        if not _missing_sections(merged, text_for_llm):
            break

        if attempt + 1 < _MAX_STRUCTURE_ATTEMPTS:
            logger.warning(
                "AI structuring attempt %d dropped section(s) %s that appear present in "
                "the source text — retrying to recover them",
                attempt + 1,
                sorted(_missing_sections(merged, text_for_llm)),
            )

    if merged is None:
        return {
            "resume": Resume(),
            "incomplete": True,
            "warnings": warnings or ["AI structuring failed"],
        }

    return {"resume": _to_resume(merged), "incomplete": False, "warnings": []}


def validate_node(state: ParserState) -> ParserState:
    resume = state.get("resume")
    warnings = list(state.get("warnings", []))
    incomplete = state.get("incomplete", False)

    try:
        validated = Resume.model_validate(
            resume.model_dump() if isinstance(resume, Resume) else resume
        )
    except ValidationError as exc:
        warnings.append(f"Validation fallback: {exc}")
        return {"resume": Resume(), "incomplete": True, "warnings": warnings}

    if (
        not validated.basics.name
        and not validated.sections.experience.items
        and not validated.sections.education.items
    ):
        incomplete = True
        warnings.append(
            "Parsed resume looks incomplete; please review and fill in manually."
        )

    return {"resume": validated, "incomplete": incomplete, "warnings": warnings}


def _strip_stray_bullet_prefixes(data):
    """PII masking occasionally swallows a leading "• " bullet marker into
    the same placeholder span as the text right after it (e.g. misreading
    "Integrated Zoom" as a location) — `richtext_from_plain` never sees that
    marker at structuring time (it's hidden inside the placeholder token), so
    once unmasking rehydrates the real text the "• " comes back embedded in
    `html` even though `type` was already correctly set to "bullet" by the
    other lines in the same block, leaving a redundant marker alongside the
    UI's own bullet glyph. Recursively strips any such leftover marker from
    every RichTextEntry-shaped dict in the unmasked payload."""
    if isinstance(data, dict):
        html = data.get("html")
        if isinstance(html, str):
            for prefix in BULLET_PREFIXES:
                if html.startswith(prefix):
                    data["html"] = html[len(prefix) :].lstrip()
                    break
        return {key: _strip_stray_bullet_prefixes(value) for key, value in data.items()}
    if isinstance(data, list):
        return [_strip_stray_bullet_prefixes(item) for item in data]
    return data


def unmask_node(state: ParserState) -> ParserState:
    """Unmasking & Hydration Service: rehydrates PII placeholder tokens
    scattered throughout the validated Resume's JSON back to their real
    values, via pii-data-service. No-op if masking was skipped/unavailable."""
    mapping_id = state.get("mapping_id")
    resume = state.get("resume")
    if not mapping_id or not isinstance(resume, Resume):
        return {}

    unmasked_data = pii_client.unmask(resume.model_dump(), mapping_id)
    unmasked_data = _strip_stray_bullet_prefixes(unmasked_data)
    try:
        return {"resume": Resume.model_validate(unmasked_data)}
    except ValidationError:
        # Keep the already-validated (still-masked) resume rather than losing data.
        return {}


def build_parser_graph():
    graph = StateGraph(ParserState)
    graph.add_node("mask", mask_node)
    graph.add_node("structure", structure_node)
    graph.add_node("validate", validate_node)
    graph.add_node("unmask", unmask_node)
    graph.set_entry_point("mask")
    graph.add_edge("mask", "structure")
    graph.add_edge("structure", "validate")
    graph.add_edge("validate", "unmask")
    graph.add_edge("unmask", END)
    return graph.compile()


_PARSER_GRAPH = None


def parse_resume_text(raw_text: str, improve: bool = False) -> ParserState:
    global _PARSER_GRAPH
    if _PARSER_GRAPH is None:
        _PARSER_GRAPH = build_parser_graph()
    return _PARSER_GRAPH.invoke({"raw_text": raw_text, "improve": improve})
