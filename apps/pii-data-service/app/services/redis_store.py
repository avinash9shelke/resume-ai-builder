"""Redis-backed storage for placeholder -> original-PII-value mappings.

Each `/mask` call creates one mapping (a Redis hash), keyed by a generated
`mapping_id`, e.g. `pii_mapping:<uuid>` -> {"<PERSON_1>": "Ada Lovelace", ...}.
`/unmask` reads it back by id to hydrate placeholders in the LLM's response.
"""

from functools import lru_cache

import redis

from app.config import get_settings

_KEY_PREFIX = "pii_mapping:"


@lru_cache
def get_redis_client() -> redis.Redis:
    settings = get_settings()
    return redis.from_url(settings.redis_url, decode_responses=True, socket_timeout=2)


def _key(mapping_id: str) -> str:
    return f"{_KEY_PREFIX}{mapping_id}"


def save_mapping(client: redis.Redis, mapping_id: str, mapping: dict[str, str]) -> None:
    if not mapping:
        return
    settings = get_settings()
    key = _key(mapping_id)
    client.hset(key, mapping=mapping)
    client.expire(key, settings.mapping_ttl_seconds)


def load_mapping(client: redis.Redis, mapping_id: str) -> dict[str, str]:
    return client.hgetall(_key(mapping_id))
