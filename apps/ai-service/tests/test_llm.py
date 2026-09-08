from unittest.mock import patch

from app.agents.llm import get_llm
from app.config import Settings


def test_get_llm_forces_default_temperature_for_reasoning_models():
    """Regression test: gpt-5/o1/o3/o4 models reject any non-default
    temperature (the API only accepts 1) — passing e.g. 0 or 0.7 fails every
    LLM call with a 400 error, silently degrading resume parsing/polish to
    empty fallback output. Note langchain-openai's ChatOpenAI always sends
    *some* temperature (its field defaults to 0.7) even if we don't pass
    one, so get_llm must explicitly force 1 rather than omit the kwarg."""
    get_llm.cache_clear()
    fake_settings = Settings(openai_model="gpt-5-nano", openai_api_key="test-key")
    with (
        patch("app.agents.llm.get_settings", return_value=fake_settings),
        patch("app.agents.llm.ChatOpenAI") as mock_chat_openai,
    ):
        get_llm(temperature=0)
    mock_chat_openai.assert_called_once_with(
        model="gpt-5-nano", api_key="test-key", temperature=1
    )
    get_llm.cache_clear()


def test_get_llm_passes_temperature_for_standard_models():
    get_llm.cache_clear()
    fake_settings = Settings(openai_model="gpt-4o-mini", openai_api_key="test-key")
    with (
        patch("app.agents.llm.get_settings", return_value=fake_settings),
        patch("app.agents.llm.ChatOpenAI") as mock_chat_openai,
    ):
        get_llm(temperature=0)
    mock_chat_openai.assert_called_once_with(
        model="gpt-4o-mini", api_key="test-key", temperature=0
    )
    get_llm.cache_clear()
