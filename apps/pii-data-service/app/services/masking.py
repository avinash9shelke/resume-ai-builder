"""PII detection + reversible masking, backed by Microsoft Presidio.

Each distinct detected value (e.g. a specific name, email, or phone number)
is replaced with a stable placeholder token like `<PERSON_1>`; repeated
occurrences of the same value reuse the same placeholder. The placeholder ->
original-value mapping is the caller's responsibility to persist (see
app/services/redis_store.py) and pass back in to `unmask`.
"""

from functools import lru_cache
from typing import Any

from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider

from app.config import get_settings

# Entities that identify a specific person (who they are / how to reach
# them). Deliberately excludes e.g. DATE_TIME and ORGANIZATION, which the
# LLM needs intact to correctly extract employment dates and company names.
MASKED_ENTITIES = ["PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "LOCATION"]


@lru_cache
def get_analyzer() -> AnalyzerEngine:
    settings = get_settings()
    provider = NlpEngineProvider(
        nlp_configuration={
            "nlp_engine_name": "spacy",
            "models": [{"lang_code": "en", "model_name": settings.spacy_model}],
        }
    )
    return AnalyzerEngine(
        nlp_engine=provider.create_engine(), supported_languages=["en"]
    )


def _non_overlapping(results: list) -> list:
    """Keeps the highest-confidence match for each span, dropping overlaps."""
    ordered = sorted(results, key=lambda r: (r.start, -r.score))
    accepted: list = []
    last_end = -1
    for result in ordered:
        if result.start >= last_end:
            accepted.append(result)
            last_end = result.end
    return accepted


def mask_text(text: str) -> tuple[str, dict[str, str]]:
    """Returns (masked_text, mapping) where mapping is {placeholder: original_value}."""
    if not text.strip():
        return text, {}

    analyzer = get_analyzer()
    results = _non_overlapping(
        analyzer.analyze(text=text, language="en", entities=MASKED_ENTITIES)
    )

    value_to_placeholder: dict[str, str] = {}
    type_counters: dict[str, int] = {}
    masked = text

    # Replace from the end of the string backwards so earlier offsets stay valid.
    for result in sorted(results, key=lambda r: r.start, reverse=True):
        value = text[result.start : result.end]
        placeholder = value_to_placeholder.get(value)
        if placeholder is None:
            type_counters[result.entity_type] = (
                type_counters.get(result.entity_type, 0) + 1
            )
            placeholder = f"<{result.entity_type}_{type_counters[result.entity_type]}>"
            value_to_placeholder[value] = placeholder
        masked = masked[: result.start] + placeholder + masked[result.end :]

    # NER only flags *some* mentions of a repeated entity (e.g. a name used
    # twice may only be tagged once) — catch any remaining literal repeats of
    # already-detected values so the same person/contact isn't left exposed.
    for value, placeholder in sorted(
        value_to_placeholder.items(), key=lambda kv: -len(kv[0])
    ):
        masked = masked.replace(value, placeholder)

    mapping = {
        placeholder: value for value, placeholder in value_to_placeholder.items()
    }
    return masked, mapping


def unmask_value(data: Any, mapping: dict[str, str]) -> Any:
    """Recursively replaces placeholder tokens with their original values
    throughout an arbitrary JSON-like structure (str/dict/list/other)."""
    if not mapping:
        return data
    if isinstance(data, str):
        for placeholder, original in mapping.items():
            data = data.replace(placeholder, original)
        return data
    if isinstance(data, dict):
        return {key: unmask_value(value, mapping) for key, value in data.items()}
    if isinstance(data, list):
        return [unmask_value(item, mapping) for item in data]
    return data
