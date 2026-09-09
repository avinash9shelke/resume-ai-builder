from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration, sourced from environment variables / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    cors_origins: list[str] = ["https://resume-ai-builder-2e5z.onrender.com"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
