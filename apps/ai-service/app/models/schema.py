"""Pydantic models mirroring the Resume schema.

Modeled on the Reactive Resume schema (https://rxresu.me/schema.json), per
user request. Must stay structurally in sync with
`packages/resume-schema/src/index.ts` (the Zod definitions used by the
frontend) — see that file's module docstring for the pragmatic adaptations
made (RichText instead of a single HTML string; a practical `metadata`
subset instead of the full styleRules/stylesheet DSL).
"""

from __future__ import annotations

import re
import uuid
from typing import Literal

from pydantic import BaseModel, Field


def _new_id() -> str:
    return str(uuid.uuid4())


class Website(BaseModel):
    url: str = ""
    label: str = ""


class CustomField(BaseModel):
    id: str = Field(default_factory=_new_id)
    icon: str = ""
    text: str = ""
    link: str = ""


class Picture(BaseModel):
    hidden: bool = False
    fit: Literal["cover", "contain"] = "cover"
    url: str = ""
    size: float = 120
    rotation: float = 0
    aspectRatio: float = 1
    borderRadius: float = 50
    borderColor: str = "rgba(0, 0, 0, 0)"
    borderWidth: float = 0
    shadowColor: str = "rgba(0, 0, 0, 0)"
    shadowWidth: float = 0


RichTextBlockType = Literal["paragraph", "bullet"]


class RichTextEntry(BaseModel):
    """A single block within a long-text field (Summary.content,
    ExperienceItem.description, etc). Mirrors `RichTextEntry` in
    packages/resume-schema/src/richText.ts."""

    id: str = Field(default_factory=_new_id)
    type: RichTextBlockType = "paragraph"
    html: str = ""
    date: str = ""
    dateTo: str = ""


RichText = list[RichTextEntry]


def richtext_to_plain(entries: RichText) -> str:
    """Strips markup and joins entries into plain text (used for AI parsing/polish)."""
    lines = []
    for entry in entries:
        text = re.sub(r"<[^>]*>", "", entry.html).strip()
        if not text:
            continue
        lines.append(f"• {text}" if entry.type == "bullet" else text)
    return "\n".join(lines)


# Markers `file_extract.py` / the LLM may emit at the start of a bulleted
# line — mirrors BULLET_PREFIXES in packages/resume-schema/src/richText.ts.
BULLET_PREFIXES = ("• ", "- ", "* ", "◦ ", "▪ ")


def richtext_from_plain(text: str) -> RichText:
    """Wraps a plain-text string (e.g. parsed/polished text) into rich text
    entries. A line starting with a bullet marker (e.g. "• ") becomes a
    bullet-type entry with the marker stripped, so bulleted resume content
    (work-experience bullet points, etc.) renders as a bulleted list in the
    UI instead of a stack of plain paragraphs.

    If *any* line in the text has a bullet marker, every line is treated as
    a bullet — a resume field is realistically either "all bullets" or "a
    paragraph", never a mix, and the LLM occasionally drops the marker from
    just one line of an otherwise fully-bulleted block, which would
    otherwise leave a single stray paragraph sitting in the middle of a
    bullet list."""
    parsed: list[tuple[str, bool]] = []
    for raw_line in text.split("\n"):
        line = raw_line.strip()
        if not line:
            continue
        has_marker = False
        for prefix in BULLET_PREFIXES:
            if line.startswith(prefix):
                line = line[len(prefix) :].strip()
                has_marker = True
                break
        parsed.append((line, has_marker))

    any_bullet = any(has_marker for _, has_marker in parsed)
    entry_type: RichTextBlockType = "bullet" if any_bullet else "paragraph"
    return [RichTextEntry(type=entry_type, html=line) for line, _ in parsed]


class Basics(BaseModel):
    name: str = ""
    headline: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    website: Website = Field(default_factory=Website)
    customFields: list[CustomField] = Field(default_factory=list)


class Summary(BaseModel):
    title: str = "Summary"
    hidden: bool = False
    content: RichText = Field(default_factory=list)


class ExperienceRole(BaseModel):
    id: str = Field(default_factory=_new_id)
    position: str = ""
    period: str = ""
    description: RichText = Field(default_factory=list)


class ExperienceItem(BaseModel):
    id: str = Field(default_factory=_new_id)
    hidden: bool = False
    company: str = ""
    position: str = ""
    location: str = ""
    period: str = ""
    website: Website = Field(default_factory=Website)
    description: RichText = Field(default_factory=list)
    roles: list[ExperienceRole] = Field(default_factory=list)
    # Optional company logo (a data URL), shown next to the entry — mirrors
    # Picture.url's "store the image inline" approach.
    logo: str = ""


class EducationItem(BaseModel):
    id: str = Field(default_factory=_new_id)
    hidden: bool = False
    school: str = ""
    degree: str = ""
    area: str = ""
    grade: str = ""
    location: str = ""
    period: str = ""
    website: Website = Field(default_factory=Website)


class ProjectItem(BaseModel):
    id: str = Field(default_factory=_new_id)
    hidden: bool = False
    name: str = ""
    period: str = ""
    website: Website = Field(default_factory=Website)
    description: RichText = Field(default_factory=list)


class SkillItem(BaseModel):
    id: str = Field(default_factory=_new_id)
    hidden: bool = False
    icon: str = ""
    iconColor: str = ""
    name: str = ""
    proficiency: str = ""
    level: float = 0
    keywords: list[str] = Field(default_factory=list)


class LanguageItem(BaseModel):
    id: str = Field(default_factory=_new_id)
    hidden: bool = False
    language: str = ""
    fluency: str = ""
    level: float = 0


class InterestItem(BaseModel):
    id: str = Field(default_factory=_new_id)
    hidden: bool = False
    icon: str = ""
    iconColor: str = ""
    name: str = ""
    keywords: list[str] = Field(default_factory=list)


class AwardItem(BaseModel):
    id: str = Field(default_factory=_new_id)
    hidden: bool = False
    title: str = ""
    awarder: str = ""
    date: str = ""
    website: Website = Field(default_factory=Website)
    description: RichText = Field(default_factory=list)


class CertificationItem(BaseModel):
    id: str = Field(default_factory=_new_id)
    hidden: bool = False
    title: str = ""
    issuer: str = ""
    date: str = ""
    website: Website = Field(default_factory=Website)
    description: RichText = Field(default_factory=list)


class PublicationItem(BaseModel):
    id: str = Field(default_factory=_new_id)
    hidden: bool = False
    title: str = ""
    publisher: str = ""
    date: str = ""
    website: Website = Field(default_factory=Website)
    description: RichText = Field(default_factory=list)


class VolunteerItem(BaseModel):
    id: str = Field(default_factory=_new_id)
    hidden: bool = False
    organization: str = ""
    location: str = ""
    period: str = ""
    website: Website = Field(default_factory=Website)
    description: RichText = Field(default_factory=list)


class ReferenceItem(BaseModel):
    id: str = Field(default_factory=_new_id)
    hidden: bool = False
    name: str = ""
    position: str = ""
    website: Website = Field(default_factory=Website)
    phone: str = ""
    description: RichText = Field(default_factory=list)


class ExperienceSection(BaseModel):
    title: str = "Experience"
    hidden: bool = False
    items: list[ExperienceItem] = Field(default_factory=list)


class EducationSection(BaseModel):
    title: str = "Education"
    hidden: bool = False
    items: list[EducationItem] = Field(default_factory=list)


class ProjectsSection(BaseModel):
    title: str = "Projects"
    hidden: bool = False
    items: list[ProjectItem] = Field(default_factory=list)


class SkillsSection(BaseModel):
    title: str = "Skills"
    hidden: bool = False
    items: list[SkillItem] = Field(default_factory=list)


class LanguagesSection(BaseModel):
    title: str = "Languages"
    hidden: bool = False
    items: list[LanguageItem] = Field(default_factory=list)


class InterestsSection(BaseModel):
    title: str = "Interests"
    hidden: bool = False
    items: list[InterestItem] = Field(default_factory=list)


class AwardsSection(BaseModel):
    title: str = "Awards"
    hidden: bool = False
    items: list[AwardItem] = Field(default_factory=list)


class CertificationsSection(BaseModel):
    title: str = "Certifications"
    hidden: bool = False
    items: list[CertificationItem] = Field(default_factory=list)


class PublicationsSection(BaseModel):
    title: str = "Publications"
    hidden: bool = False
    items: list[PublicationItem] = Field(default_factory=list)


class VolunteerSection(BaseModel):
    title: str = "Volunteering"
    hidden: bool = False
    items: list[VolunteerItem] = Field(default_factory=list)


class ReferencesSection(BaseModel):
    title: str = "References"
    hidden: bool = False
    items: list[ReferenceItem] = Field(default_factory=list)


class Sections(BaseModel):
    experience: ExperienceSection = Field(default_factory=ExperienceSection)
    education: EducationSection = Field(default_factory=EducationSection)
    projects: ProjectsSection = Field(default_factory=ProjectsSection)
    skills: SkillsSection = Field(default_factory=SkillsSection)
    languages: LanguagesSection = Field(default_factory=LanguagesSection)
    interests: InterestsSection = Field(default_factory=InterestsSection)
    awards: AwardsSection = Field(default_factory=AwardsSection)
    certifications: CertificationsSection = Field(default_factory=CertificationsSection)
    publications: PublicationsSection = Field(default_factory=PublicationsSection)
    volunteer: VolunteerSection = Field(default_factory=VolunteerSection)
    references: ReferencesSection = Field(default_factory=ReferencesSection)


SECTION_KEYS: list[str] = [
    "experience",
    "education",
    "projects",
    "skills",
    "languages",
    "interests",
    "awards",
    "certifications",
    "publications",
    "volunteer",
    "references",
]


class CustomSectionItem(BaseModel):
    """A single entry within a user-defined custom section (simplified,
    single-shape extension — not the full rxresu.me `oneOf` union)."""

    id: str = Field(default_factory=_new_id)
    hidden: bool = False
    title: str = ""
    subtitle: str = ""
    date: str = ""
    website: Website = Field(default_factory=Website)
    description: RichText = Field(default_factory=list)


class CustomSection(BaseModel):
    """A fully user-defined section (title + free-form entries). Its layout
    placement id uses the `custom:<uuid>` format (see CUSTOM_SECTION_PREFIX)."""

    id: str = Field(default_factory=lambda: f"custom:{_new_id()}")
    title: str = "Custom Section"
    hidden: bool = False
    items: list[CustomSectionItem] = Field(default_factory=list)
    icon: str = ""
    showDate: bool = False


CUSTOM_SECTION_PREFIX = "custom:"

BuiltInSectionId = Literal[
    "basics",
    "summary",
    "experience",
    "education",
    "projects",
    "skills",
    "languages",
    "interests",
    "awards",
    "certifications",
    "publications",
    "volunteer",
    "references",
]

# A section id is either a built-in id, or a `custom:<uuid>` id referencing
# `Resume.customSections`. Kept as `str` (rather than a Literal union) since
# custom ids are dynamic.
SectionId = str

DEFAULT_SECTION_ORDER: list[BuiltInSectionId] = [
    "basics",
    "summary",
    "experience",
    "education",
    "projects",
    "skills",
    "languages",
    "interests",
    "awards",
    "certifications",
    "publications",
    "volunteer",
    "references",
]


class SectionPlacement(BaseModel):
    id: SectionId
    column: int = 0


class Layout(BaseModel):
    columns: Literal[1, 2] = 1
    sectionOrder: list[SectionPlacement] = Field(
        default_factory=lambda: [
            SectionPlacement(id=section_id, column=0)
            for section_id in DEFAULT_SECTION_ORDER
        ]
    )


TemplateKey = Literal[
    "refined",
    "classic-serif",
    "obsidian-edge",
    "precision-line",
    "silver-banner",
    "cobalt-edge",
    "editorial-rule",
    "true-blue",
    "saffron-line",
    "steady-form",
    "hunter-green",
    "quicksilver",
    "classic-clear",
    "atlantic-blue",
    "mercury-flow",
]
PageFormat = Literal["a4", "letter"]


class Page(BaseModel):
    format: PageFormat = "letter"
    marginX: float = 14
    marginY: float = 12
    hideLinkUnderline: bool = False


class DesignColors(BaseModel):
    primary: str = "rgba(37, 99, 235, 1)"
    text: str = "rgba(17, 24, 39, 1)"
    background: str = "rgba(255, 255, 255, 1)"


class Design(BaseModel):
    colors: DesignColors = Field(default_factory=DesignColors)


SubtitleStyle = Literal["normal", "bold", "italic"]


class Typography(BaseModel):
    fontFamily: str = "Inter"
    fontSize: float = 11
    lineHeight: float = 1.5
    subtitleStyle: SubtitleStyle = "normal"


PhotoStyle = Literal["circle", "square"]


class ProfileSettings(BaseModel):
    """Controls which fields of the Profile/Basics card are shown, and how
    the name/photo are styled. Surfaced via the section-settings ("gear")
    menu in the editor."""

    showHeadline: bool = True
    showPhone: bool = False
    showWebsite: bool = True
    showEmail: bool = True
    showLocation: bool = True
    uppercaseName: bool = True
    photoStyle: PhotoStyle = "circle"


# Selectable color-theme variants — mirrors THEME_PRESETS in
# packages/resume-schema/src/index.ts.
THEME_PRESETS: dict[str, DesignColors] = {
    "classic-blue": DesignColors(
        primary="rgba(37, 99, 235, 1)",
        text="rgba(17, 24, 39, 1)",
        background="rgba(255, 255, 255, 1)",
    ),
    "midnight": DesignColors(
        primary="rgba(30, 41, 59, 1)",
        text="rgba(15, 23, 42, 1)",
        background="rgba(255, 255, 255, 1)",
    ),
    "emerald": DesignColors(
        primary="rgba(5, 150, 105, 1)",
        text="rgba(17, 24, 39, 1)",
        background="rgba(255, 255, 255, 1)",
    ),
    "crimson": DesignColors(
        primary="rgba(220, 38, 38, 1)",
        text="rgba(17, 24, 39, 1)",
        background="rgba(255, 255, 255, 1)",
    ),
    "amber": DesignColors(
        primary="rgba(217, 119, 6, 1)",
        text="rgba(17, 24, 39, 1)",
        background="rgba(255, 255, 255, 1)",
    ),
    "violet": DesignColors(
        primary="rgba(124, 58, 237, 1)",
        text="rgba(17, 24, 39, 1)",
        background="rgba(255, 255, 255, 1)",
    ),
}

DEFAULT_THEME_BY_TEMPLATE: dict[str, str] = {
    "refined": "midnight",
    "classic-serif": "midnight",
    "obsidian-edge": "midnight",
    "precision-line": "classic-blue",
    "silver-banner": "classic-blue",
    "cobalt-edge": "classic-blue",
    "editorial-rule": "midnight",
    "true-blue": "classic-blue",
    "saffron-line": "amber",
    "steady-form": "midnight",
    "hunter-green": "emerald",
    "quicksilver": "midnight",
    "classic-clear": "midnight",
    "atlantic-blue": "classic-blue",
    "mercury-flow": "midnight",
    "meridian-slate": "classic-blue",
    "azure-banner": "classic-blue",
    "teal-outline": "emerald",
    "teal-portrait": "emerald",
    "dual-grid": "classic-blue",
}


class Metadata(BaseModel):
    # Deliberately a permissive str (not the TemplateKey Literal): an
    # unknown/since-removed template value should still validate — the pdf
    # renderer/preview fall back to "refined" for anything unrecognized,
    # rather than hard-failing the whole resume.
    template: str = "refined"
    theme: str = "classic-blue"
    layout: Layout = Field(default_factory=Layout)
    page: Page = Field(default_factory=Page)
    design: Design = Field(default_factory=Design)
    typography: Typography = Field(default_factory=Typography)
    profileSettings: ProfileSettings = Field(default_factory=ProfileSettings)
    notes: str = ""


class Resume(BaseModel):
    id: str | None = None
    title: str = "Untitled Resume"
    picture: Picture = Field(default_factory=Picture)
    basics: Basics = Field(default_factory=Basics)
    summary: Summary = Field(default_factory=Summary)
    sections: Sections = Field(default_factory=Sections)
    customSections: list[CustomSection] = Field(default_factory=list)
    metadata: Metadata = Field(default_factory=Metadata)
    createdAt: str | None = None
    updatedAt: str | None = None


class ParseResumeResponse(BaseModel):
    resume: Resume
    incomplete: bool = False
    warnings: list[str] = Field(default_factory=list)


PolishTarget = Literal["summary", "experience_description", "project_description"]


class PolishRequest(BaseModel):
    target: PolishTarget
    text: str
    context: dict[str, str] | None = None


class PolishResponse(BaseModel):
    suggestions: list[str] = Field(min_length=5, max_length=5)
