"""HTTP client for the pii-data-service (PII Masking/Anonymization Engine +
Unmasking & Hydration Service — see ARCHITECTURE.md).

Failures (service down, timeout, etc.) degrade gracefully: masking falls
back to "no masking" and unmasking falls back to "return data unchanged",
so a missing/unreachable pii-data-service never blocks resume parsing —
it just means PII isn't shielded from the LLM for that request.
"""

from typing import Any

import httpx

from app.config import get_settings

_TIMEOUT_SECONDS = 5.0


def mask(raw_text: str) -> tuple[str, str | None]:
    """Returns (text_to_send_to_the_llm, mapping_id). mapping_id is None if
    masking failed/was skipped, in which case the original text is returned."""
    settings = get_settings()
    try:
        response = httpx.post(
            f"{settings.pii_service_url}/mask",
            json={"text": raw_text},
            timeout=_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        body = response.json()
        return body["masked_text"], body["mapping_id"]
    except Exception:  # noqa: BLE001 - any pii-data-service failure is non-fatal
        return raw_text, None


def unmask(data: Any, mapping_id: str | None) -> Any:
    """Hydrates PII placeholders in `data` back to their real values."""
    if not mapping_id:
        return data
    settings = get_settings()
    try:
        response = httpx.post(
            f"{settings.pii_service_url}/unmask",
            json={"mapping_id": mapping_id, "data": data},
            timeout=_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        return response.json()["data"]
    except Exception:  # noqa: BLE001 - any pii-data-service failure is non-fatal
        return data
