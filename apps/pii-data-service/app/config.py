from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration, sourced from environment variables / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    redis_url: str = "redis://localhost:6379/0"
    # How long a mask <-> original-value mapping lives in Redis before it
    # expires. Only needs to outlive a single mask -> LLM -> unmask round
    # trip, so this is intentionally short.
    mapping_ttl_seconds: int = 60 * 10
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:8000"]
    # spaCy model used by Presidio's analyzer for NLP-based PII detection.
    spacy_model: str = "en_core_web_sm"


@lru_cache
def get_settings() -> Settings:
    return Settings()
