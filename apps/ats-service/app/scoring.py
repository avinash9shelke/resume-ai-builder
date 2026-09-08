"""Rule-based ATS (Applicant Tracking System) readiness scoring.

Deliberately deterministic/rule-based rather than LLM-based: scoring should
be fast, free, and reproducible (the same resume always gets the same score
and the same actionable feedback), which a rule engine gives us for free.
"""

import re
from typing import Any

from app.models import CategoryResult, ScoreResponse

_TAG_RE = re.compile(r"<[^>]+>")
_NUMBER_RE = re.compile(r"\d|%|\$")
_WORD_RE = re.compile(r"[A-Za-z']+")

# A representative (not exhaustive) set of strong resume action verbs. Bullet
# points that open with one of these read as achievement-oriented rather than
# duty-oriented, which is what ATS keyword scans and human reviewers alike
# reward.
ACTION_VERBS = {
    "achieved",
    "analyzed",
    "architected",
    "authored",
    "automated",
    "built",
    "chaired",
    "coordinated",
    "collaborated",
    "conducted",
    "created",
    "decreased",
    "delivered",
    "deployed",
    "designed",
    "developed",
    "directed",
    "drove",
    "engineered",
    "enhanced",
    "established",
    "executed",
    "expanded",
    "facilitated",
    "generated",
    "implemented",
    "improved",
    "increased",
    "initiated",
    "integrated",
    "introduced",
    "launched",
    "led",
    "maintained",
    "managed",
    "mentored",
    "migrated",
    "monitored",
    "negotiated",
    "optimized",
    "organized",
    "oversaw",
    "pioneered",
    "planned",
    "presented",
    "produced",
    "reduced",
    "refactored",
    "researched",
    "resolved",
    "restructured",
    "reviewed",
    "scaled",
    "simplified",
    "solved",
    "spearheaded",
    "streamlined",
    "supervised",
    "trained",
    "transformed",
    "upgraded",
}


def _strip_html(html: str | None) -> str:
    return _TAG_RE.sub("", html or "").strip()


def _richtext_entries_text(entries: Any) -> list[str]:
    """Plain-text for each rich-text entry (paragraph or bullet) in a
    description/summary field, skipping empty ones."""
    if not isinstance(entries, list):
        return []
    texts = [
        _strip_html(e.get("html") if isinstance(e, dict) else None) for e in entries
    ]
    return [t for t in texts if t]


def _word_count(text: str) -> int:
    return len(_WORD_RE.findall(text))


def _status_for_score(score: int) -> str:
    if score >= 80:
        return "good"
    if score >= 50:
        return "warning"
    return "critical"


def _category(
    category_id: str,
    label: str,
    score: int,
    weight: int,
    good_message: str,
    warning_message: str,
    critical_message: str,
    suggestions: list[str],
    sectionId: str | None,
) -> CategoryResult:
    score = max(0, min(100, round(score)))
    status = _status_for_score(score)
    message = {
        "good": good_message,
        "warning": warning_message,
        "critical": critical_message,
    }[status]
    return CategoryResult(
        id=category_id,
        label=label,
        score=score,
        weight=weight,
        status=status,
        message=message,
        suggestions=[] if status == "good" else suggestions,
        sectionId=sectionId,
    )


def _score_contact_info(resume: dict[str, Any]) -> CategoryResult:
    basics = resume.get("basics") or {}
    website = basics.get("website") or {}
    fields = {
        "email": basics.get("email"),
        "phone": basics.get("phone"),
        "location": basics.get("location"),
        "website/portfolio link": website.get("url"),
    }
    present = [name for name, value in fields.items() if value]
    missing = [name for name in fields if name not in present]
    score = round(len(present) / len(fields) * 100)
    return _category(
        "contact_info",
        "Contact Information",
        score,
        weight=10,
        good_message="Your contact info is complete and easy for recruiters (and ATS parsers) to find.",
        warning_message=f"Missing: {', '.join(missing)}. Add these so recruiters can reach you.",
        critical_message=f"Missing: {', '.join(missing)}. ATS systems need this to contact you.",
        suggestions=[f"Add your {name}" for name in missing],
        sectionId="basics",
    )


def _score_summary(resume: dict[str, Any]) -> CategoryResult:
    summary = resume.get("summary") or {}
    text = " ".join(_richtext_entries_text(summary.get("content")))
    words = _word_count(text)

    if words == 0:
        score = 0
    elif words < 15:
        score = 45
    elif words > 150:
        score = 65
    else:
        score = 100

    return _category(
        "summary",
        "Professional Summary",
        score,
        weight=15,
        good_message="Your summary is a solid, well-sized introduction.",
        warning_message="Your summary is too short or too long — aim for 30-80 words.",
        critical_message="Add a professional summary — it's often the first thing recruiters scan.",
        suggestions=[
            "Write 2-3 sentences summarizing your experience, key skills, and career focus.",
            "Aim for 30-80 words — long enough to be substantive, short enough to be skimmable.",
        ],
        sectionId="summary",
    )


def _score_experience(resume: dict[str, Any]) -> CategoryResult:
    items = ((resume.get("sections") or {}).get("experience") or {}).get("items") or []
    if not items:
        return _category(
            "experience_impact",
            "Experience & Impact",
            0,
            weight=30,
            good_message="",
            warning_message="",
            critical_message="Add work experience — it's ATS's most heavily-weighted section.",
            suggestions=["Add your work experience, with 2-5 bullet points per role."],
            sectionId="experience",
        )

    bullets: list[str] = []
    for item in items:
        bullets.extend(_richtext_entries_text(item.get("description")))

    if not bullets:
        return _category(
            "experience_impact",
            "Experience & Impact",
            25,
            weight=30,
            good_message="",
            warning_message="Your experience entries don't have any bullet points describing what you did.",
            critical_message="Your experience entries don't have any bullet points describing what you did.",
            suggestions=[
                "Add 2-5 bullet points per role describing your responsibilities and achievements."
            ],
            sectionId="experience",
        )

    quantified = sum(1 for b in bullets if _NUMBER_RE.search(b))
    action_led = sum(1 for b in bullets if _first_word(b) in ACTION_VERBS)
    quant_ratio = quantified / len(bullets)
    verb_ratio = action_led / len(bullets)
    score = (quant_ratio * 0.5 + verb_ratio * 0.5) * 100

    suggestions = []
    if quant_ratio < 0.5:
        suggestions.append(
            "Quantify your achievements with numbers, percentages, or dollar amounts "
            '(e.g. "increased conversion by 18%") — only '
            f"{quantified}/{len(bullets)} bullets currently include one."
        )
    if verb_ratio < 0.5:
        suggestions.append(
            "Start bullet points with a strong action verb (Led, Built, Improved, Launched...) "
            f"— only {action_led}/{len(bullets)} currently do."
        )

    return _category(
        "experience_impact",
        "Experience & Impact",
        score,
        weight=30,
        good_message="Your experience bullets are achievement-oriented and quantified.",
        warning_message="Some experience bullets could better highlight quantified, achievement-driven work.",
        critical_message="Your bullets read as duties, not wins — add numbers and strong action verbs.",
        suggestions=suggestions,
        sectionId="experience",
    )


def _first_word(text: str) -> str:
    match = _WORD_RE.search(text)
    return match.group(0).lower() if match else ""


def _score_skills(resume: dict[str, Any]) -> CategoryResult:
    items = ((resume.get("sections") or {}).get("skills") or {}).get("items") or []
    count = len(items)
    score = round(min(count, 8) / 8 * 100)
    return _category(
        "skills",
        "Skills",
        score,
        weight=15,
        good_message=f"You've listed {count} skills — a healthy set of ATS-matchable keywords.",
        warning_message=f"Only {count} skills listed — add more relevant keywords to match job descriptions.",
        critical_message="Add a Skills section — ATS software matches candidates largely by keyword overlap.",
        suggestions=[
            "List 8+ relevant technical and soft skills, matching keywords from job postings you target."
        ],
        sectionId="skills",
    )


def _score_education(resume: dict[str, Any]) -> CategoryResult:
    items = ((resume.get("sections") or {}).get("education") or {}).get("items") or []
    score = 100 if items else 0
    return _category(
        "education",
        "Education",
        score,
        weight=10,
        good_message="Education section is present.",
        warning_message="",
        critical_message="Add your education — most ATS templates expect this section to be present.",
        suggestions=["Add your degree(s), institution(s), and graduation date(s)."],
        sectionId="education",
    )


def _score_length_and_structure(resume: dict[str, Any]) -> CategoryResult:
    basics = resume.get("basics") or {}
    sections = resume.get("sections") or {}
    summary_text = " ".join(
        _richtext_entries_text((resume.get("summary") or {}).get("content"))
    )

    all_text_parts = [
        basics.get("name") or "",
        basics.get("headline") or "",
        summary_text,
    ]
    for key in ("experience", "projects", "volunteer", "awards"):
        for item in (sections.get(key) or {}).get("items") or []:
            all_text_parts.extend(_richtext_entries_text(item.get("description")))

    total_words = _word_count(" ".join(all_text_parts))
    name_present = bool(basics.get("name"))

    if 250 <= total_words <= 900:
        length_score = 100
    elif total_words == 0:
        length_score = 0
    else:
        # Linear falloff the further outside the ideal band the resume is.
        distance = (
            min(250, abs(total_words - 250))
            if total_words < 250
            else min(400, total_words - 900)
        )
        length_score = max(20, 100 - round(distance / 4))

    score = length_score if name_present else length_score * 0.5

    suggestions = []
    if not name_present:
        suggestions.append(
            "Add your name — it's the first thing an ATS parser looks for."
        )
    if total_words < 250:
        suggestions.append(
            "Your resume looks thin — add more detail to your experience and skills."
        )
    elif total_words > 900:
        suggestions.append(
            "Your resume is quite long — trim it to keep reviewers focused on your strongest points."
        )

    return _category(
        "length_and_structure",
        "Length & Structure",
        score,
        weight=20,
        good_message="Your resume is a well-balanced length with all the essentials in place.",
        warning_message="Your resume's length could be tightened up for easier scanning.",
        critical_message="Your resume is missing key information or is far too short/long for ATS parsing.",
        suggestions=suggestions,
        sectionId=None,
    )


def compute_score(resume: dict[str, Any]) -> ScoreResponse:
    categories = [
        _score_contact_info(resume),
        _score_summary(resume),
        _score_experience(resume),
        _score_skills(resume),
        _score_education(resume),
        _score_length_and_structure(resume),
    ]
    total_weight = sum(c.weight for c in categories)
    overall = round(sum(c.score * c.weight for c in categories) / total_weight)
    highlighted = sorted(
        {c.sectionId for c in categories if c.status != "good" and c.sectionId}
    )
    return ScoreResponse(
        overallScore=overall, categories=categories, highlightedSections=highlighted
    )
