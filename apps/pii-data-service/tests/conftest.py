import fakeredis
import pytest
from fastapi.testclient import TestClient

from app.db import get_redis
from app.main import app


@pytest.fixture()
def redis_client():
    return fakeredis.FakeRedis(decode_responses=True)


@pytest.fixture()
def client(redis_client):
    app.dependency_overrides[get_redis] = lambda: redis_client
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
