"""LangGraph workflow for Feature 3 (AI Polish Section).

Nodes, per ARCHITECTURE.md:
  1. Polisher  - generates 5 variations of the given text.
  2. Validator - ensures exactly 5, distinct, non-empty suggestions.
"""

import logging
import re
from typing import TypedDict

from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

from app.agents.llm import get_llm
from app.models.schema import PolishRequest

logger = logging.getLogger(__name__)

TARGET_INSTRUCTIONS = {
    "summary": "a professional resume summary",
    "experience_description": "a resume work-experience description",
    "project_description": "a resume project description",
}

POLISH_PROMPT = """You are an expert resume writer helping someone improve {target_description}.

Rewrite the text so it is more impactful, concise, and quantifiable: use strong, \
varied action verbs (Led, Built, Increased, Reduced...), and add measurable \
results (numbers, percentages, dollar amounts) wherever it's plausible given the \
context — but never invent new facts, employers, technologies, or metrics that \
aren't implied by the original text.

CRITICAL FORMATTING RULE — read the original text below carefully:
- If it consists of multiple lines that each start with "• " (one bullet point \
per line), every one of your 5 alternative versions MUST also contain exactly \
{line_count} lines, each starting with "• ", each line being a rewrite of the \
*corresponding* original bullet in the same order. Never merge two bullets into \
one line, never drop a bullet, and never add extra bullets — the user is picking \
one full alternative to replace all of their current bullets at once, so nothing \
may be lost.
- If the original text is a single paragraph (no "• " prefixes), return a single \
rewritten paragraph for each version instead — and always expand it into a \
full, substantial paragraph (roughly 3-5 sentences, about 40-80 words), even if \
the original is much shorter. A short original is exactly what you're meant to \
flesh out, not something to keep short.

Produce exactly 5 distinct alternative versions, each roughly the same length as \
the original unless expanding it clearly adds value (a short single-paragraph \
original should always be expanded per the rule above).

IMPORTANT: each of the 5 versions must be the actual replacement resume text \
itself, ready to paste directly into the resume — never generic writing advice, \
tips, or commentary about *how* to improve it, and never a description of what \
you did to the text or what the rewritten versions will contain. For example, \
if the original were "• Managed a small team.", a WRONG response would be \
"• Use stronger verbs and quantify team size." or "• Emphasize leadership and \
preserve the team context." (both are commentary ABOUT the rewrite, not the \
rewrite itself) — a correct response would be an actual replacement bullet \
like "• Led a team of 5 engineers, delivering projects on schedule."

Original text ({line_count} line(s)):
---
{text}
---

Additional context about this resume section (may be empty): {context}
"""


def _count_bullet_lines(text: str) -> int:
    return sum(1 for line in text.splitlines() if line.strip().startswith("•"))


# For non-bulleted (single paragraph) text, the model occasionally responds
# with a short instructional fragment ("Keep length similar to original.",
# "Avoid new facts.") instead of an actual rewritten paragraph — the bullet
# safety net above doesn't catch this since there are no bullets to compare.
# A plausible replacement paragraph should read as full sentences, not a
# 5-11 word tip, so a simple minimum word count is an effective filter.
MIN_PARAGRAPH_WORDS = 15

_WORD_REGEX = re.compile(r"[a-zA-Z]{4,}")

# Generic enough to show up in meta-commentary about the rewriting task
# itself, so they're excluded from the content-overlap check below (they'd
# otherwise make instructional text look more "on topic" than it is).
_GENERIC_STOPWORDS = {
    "with",
    "that",
    "this",
    "from",
    "have",
    "will",
    "your",
    "their",
    "about",
    "into",
    "these",
    "those",
    "such",
    "using",
    "than",
    "then",
    "were",
    "been",
    "each",
    "line",
    "lines",
    "bullet",
    "bullets",
    "version",
    "versions",
    "provide",
    "rewrite",
    "rewritten",
    "original",
    "keep",
    "must",
    "avoid",
    "invent",
    "preserve",
    "maintain",
    "exactly",
    "never",
    "always",
    "should",
    "ensure",
}


def _significant_words(text: str) -> set[str]:
    return {w for w in _WORD_REGEX.findall(text.lower()) if w not in _GENERIC_STOPWORDS}


def _reads_like_generic_advice(suggestion: str, original: str) -> bool:
    """The model occasionally responds with meta-commentary about *how* to
    rewrite the text (e.g. "Preserve the key technologies and the platform
    name.", "Each version must start with a bullet.") rather than the actual
    rewritten resume content — and such commentary can coincidentally match
    the bullet-count check above. Real rewrites must retain the source's
    specific facts (companies, projects, technologies — the prompt forbids
    inventing new ones), while generic advice about the task rarely repeats
    them, so too little vocabulary overlap with the original is a strong
    signal it's advice rather than a rewrite. Skipped for very short
    originals, which don't carry enough distinctive vocabulary to judge by."""
    original_words = _significant_words(original)
    if len(original_words) < 3:
        return False
    overlap = original_words & _significant_words(suggestion)
    return len(overlap) < max(2, len(original_words) // 3)


def _is_valid_suggestion(suggestion: str, original: str, original_bullets: int) -> bool:
    if _reads_like_generic_advice(suggestion, original):
        return False
    if original_bullets > 1:
        return _count_bullet_lines(suggestion) == original_bullets
    return len(suggestion.split()) >= MIN_PARAGRAPH_WORDS


class _Suggestions(BaseModel):
    # A field description gets embedded directly in the structured-output
    # JSON schema sent to the model, which meaningfully changes how smaller
    # models interpret it — without one, models have been observed treating
    # each list item as one short writing tip ("Use stronger verbs.") rather
    # than one *complete* rewritten block, since "5 suggestions" reads
    # ambiguously otherwise.
    suggestions: list[str] = Field(
        description=(
            "Exactly 5 complete, independent alternative versions of the ENTIRE "
            "original text (not 5 separate tips or bullet points). If the original "
            "has multiple '• '-prefixed lines, each of these 5 strings must itself "
            "contain all of those lines rewritten, joined by newlines within that "
            "single string — never split the lines of one alternative across "
            "multiple array entries, and never a one-line writing tip."
        )
    )


class PolishState(TypedDict, total=False):
    request: PolishRequest
    suggestions: list[str]


# The model occasionally ignores the "actual replacement text, not advice"
# instruction and returns generic writing tips instead (observed fairly often
# on smaller/cheaper models, e.g. gpt-5-nano) — such a response never has
# bullet-point structure matching the original, so retrying is usually enough
# to get a clean batch rather than falling all the way back to the unmodified
# text. A higher budget here costs a bit of latency on a bad first attempt,
# but that's far better than silently returning zero improvement.
_MAX_POLISH_ATTEMPTS = 5


def polish_node(state: PolishState) -> PolishState:
    request = state["request"]
    llm = get_llm(temperature=0.7)
    structured_llm = llm.with_structured_output(_Suggestions)
    line_count = max(
        1, len([line for line in request.text.splitlines() if line.strip()])
    )
    prompt = POLISH_PROMPT.format(
        target_description=TARGET_INSTRUCTIONS.get(request.target, "resume text"),
        line_count=line_count,
        text=request.text,
        context=request.context or {},
    )
    original_bullets = _count_bullet_lines(request.text)

    collected: list[str] = []
    for attempt in range(_MAX_POLISH_ATTEMPTS):
        try:
            result = structured_llm.invoke(prompt)
            raw = [s.strip() for s in result.suggestions if s.strip()]
        except Exception:  # noqa: BLE001 - try again, or fall back to the original text
            logger.warning(
                "AI Polish LLM call failed on attempt %d", attempt + 1, exc_info=True
            )
            raw = []

        batch = [
            s for s in raw if _is_valid_suggestion(s, request.text, original_bullets)
        ]
        if raw and not batch:
            logger.warning(
                "AI Polish attempt %d discarded — model returned %d suggestion(s) that "
                "don't look like real replacement text (likely advice/commentary "
                "instead of a rewritten %s)",
                attempt + 1,
                len(raw),
                "bullet list" if original_bullets > 1 else "paragraph",
            )

        for s in batch:
            if s not in collected:
                collected.append(s)

        if len(collected) >= 5:
            break

    if not collected:
        logger.warning(
            "AI Polish exhausted all %d attempts with no valid suggestions for a %s target "
            "— falling back to the original text",
            _MAX_POLISH_ATTEMPTS,
            request.target,
        )

    return {"suggestions": collected}


def validate_node(state: PolishState) -> PolishState:
    request = state["request"]
    suggestions = list(state.get("suggestions", []))

    # Reject any suggestion that collapsed, dropped, or added bullet points (for
    # multi-bullet text), or that reads like a short instructional fragment
    # rather than an actual rewritten paragraph (for single-paragraph text) —
    # see _is_valid_suggestion.
    original_bullets = _count_bullet_lines(request.text)
    suggestions = [
        s
        for s in suggestions
        if _is_valid_suggestion(s, request.text, original_bullets)
    ]

    # De-duplicate while preserving order.
    seen: set[str] = set()
    unique = []
    for s in suggestions:
        if s not in seen:
            seen.add(s)
            unique.append(s)

    while len(unique) < 5:
        unique.append(request.text)

    return {"suggestions": unique[:5]}


def build_polish_graph():
    graph = StateGraph(PolishState)
    graph.add_node("polish", polish_node)
    graph.add_node("validate", validate_node)
    graph.set_entry_point("polish")
    graph.add_edge("polish", "validate")
    graph.add_edge("validate", END)
    return graph.compile()


_POLISH_GRAPH = None


def polish_text(request: PolishRequest) -> list[str]:
    global _POLISH_GRAPH
    if _POLISH_GRAPH is None:
        _POLISH_GRAPH = build_polish_graph()
    result = _POLISH_GRAPH.invoke({"request": request})
    return result["suggestions"]
