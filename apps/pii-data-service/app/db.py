from redis import Redis

from app.services.redis_store import get_redis_client


def get_redis() -> Redis:
    """FastAPI dependency yielding the shared Redis client."""
    return get_redis_client()
