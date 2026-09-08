from functools import lru_cache

from langchain_openai import ChatOpenAI

from app.config import get_settings

# OpenAI's newer "reasoning" models (gpt-5 / o1 / o3 / o4 families) only
# support the default temperature — the API rejects any other explicit
# value with a 400 error ("Only the default (1) value is supported").
# langchain-openai's ChatOpenAI always sends *some* temperature (its own
# pydantic field defaults to 0.7, even if we don't pass one), so for these
# models we must explicitly pass 1 rather than omit the parameter.
_FIXED_TEMPERATURE_MODEL_PREFIXES = ("gpt-5", "o1", "o3", "o4")
_FIXED_TEMPERATURE = 1


@lru_cache
def get_llm(temperature: float = 0.4) -> ChatOpenAI:
    """Configurable LangChain chat model. Defaults to OpenAI, per ARCHITECTURE.md.

    Requires `OPENAI_API_KEY` to be set at runtime; kept lazy so the app can
    boot (and be tested) without a key configured.
    """
    settings = get_settings()
    if settings.openai_model.startswith(_FIXED_TEMPERATURE_MODEL_PREFIXES):
        temperature = _FIXED_TEMPERATURE
    return ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key or "unset",
        temperature=temperature,
    )
