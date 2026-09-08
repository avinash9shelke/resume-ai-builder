import mongomock
import pytest
from fastapi.testclient import TestClient

from app.db import (
    get_ai_cache_collection,
    get_resumes_collection,
    get_sessions_collection,
)
from app.main import app


@pytest.fixture()
def client():
    mongo_client = mongomock.MongoClient()
    db = mongo_client["resume_ai_test"]

    app.dependency_overrides[get_resumes_collection] = lambda: db["resumes"]
    app.dependency_overrides[get_sessions_collection] = lambda: db["sessions"]
    app.dependency_overrides[get_ai_cache_collection] = lambda: db["ai_cache"]
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
