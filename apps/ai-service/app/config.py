from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration, sourced from environment variables / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mongodb_url: str = "mongodb://mongo:27017"
    mongodb_db_name: str = "resume_ai"
    openai_api_key: str = ""
    openai_model: str = "gpt-5-nano"
    cors_origins: list[str] = ["http://localhost:3000"]
    max_upload_mb: int = 10
    # PII Masking & Anonymization Engine (see ARCHITECTURE.md) — masks
    # personal-identity text before it reaches the LLM, and unmasks/hydrates
    # the LLM's response back to real values.
    pii_service_url: str = "http://pii-data-service:8100"
    # How long cached AI Polish/parse responses live before MongoDB's TTL
    # index prunes them (see app/db.py get_ai_cache_collection).
    ai_cache_ttl_seconds: int = 60 * 60 * 24


@lru_cache
def get_settings() -> Settings:
    return Settings()
