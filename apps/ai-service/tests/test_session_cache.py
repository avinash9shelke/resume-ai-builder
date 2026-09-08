from unittest.mock import patch

from app.db import get_ai_cache_collection, get_sessions_collection
from app.main import app
from app.services.session_cache import cache_key, get_cached, set_cached, touch_session


def test_polish_second_identical_request_hits_cache_without_calling_llm(client):
    headers = {"X-Session-Id": "session-a"}
    payload = {"target": "summary", "text": "Experienced engineer."}

    with patch(
        "app.api.routes_polish.polish_text", return_value=["A", "B", "C", "D", "E"]
    ) as mock_polish:
        first = client.post("/polish", json=payload, headers=headers)
        second = client.post("/polish", json=payload, headers=headers)

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json() == second.json()
    # The LLM-backed graph should only run once; the second call is a cache hit.
    assert mock_polish.call_count == 1


def test_polish_cache_is_scoped_per_session(client):
    payload = {"target": "summary", "text": "Experienced engineer."}

    with patch(
        "app.api.routes_polish.polish_text", return_value=["A", "B", "C", "D", "E"]
    ) as mock_polish:
        client.post("/polish", json=payload, headers={"X-Session-Id": "session-a"})
        client.post("/polish", json=payload, headers={"X-Session-Id": "session-b"})

    # Different sessions must not share a cache entry.
    assert mock_polish.call_count == 2


def test_touch_session_upserts_and_updates_last_seen(client):
    sessions = app.dependency_overrides[get_sessions_collection]()

    touch_session(sessions, "session-a")
    first = sessions.find_one({"_id": "session-a"})
    assert first is not None
    assert first["created_at"] == first["last_seen_at"]

    touch_session(sessions, "session-a")
    second = sessions.find_one({"_id": "session-a"})
    assert second["created_at"] == first["created_at"]
    assert second["last_seen_at"] >= first["last_seen_at"]


def test_get_and_set_cached_round_trip(client):
    cache = app.dependency_overrides[get_ai_cache_collection]()

    key = cache_key("polish", "session-a", "summary", "some text")
    assert get_cached(cache, key) is None

    set_cached(cache, key, "session-a", "polish", {"suggestions": ["x"]})
    assert get_cached(cache, key) == {"suggestions": ["x"]}


def test_polish_falls_back_to_rerunning_when_cached_response_is_stale(client):
    """Regression test: a cache entry written by an older, incompatible schema
    (e.g. before a schema migration) must never crash the request — it should
    be treated as a cache miss and re-run instead (see routes_polish.py)."""
    import json as _json

    cache = app.dependency_overrides[get_ai_cache_collection]()
    headers = {"X-Session-Id": "session-stale"}
    payload = {"target": "summary", "text": "Experienced engineer."}

    key = cache_key(
        "polish",
        "session-stale",
        "summary",
        "Experienced engineer.",
        _json.dumps({}, sort_keys=True),
    )
    # Simulate a stale cache entry that no longer matches PolishResponse's schema.
    set_cached(cache, key, "session-stale", "polish", {"suggestions": "not-a-list"})

    with patch(
        "app.api.routes_polish.polish_text", return_value=["A", "B", "C", "D", "E"]
    ) as mock_polish:
        response = client.post("/polish", json=payload, headers=headers)

    assert response.status_code == 200
    assert response.json()["suggestions"] == ["A", "B", "C", "D", "E"]
    mock_polish.assert_called_once()


def test_parse_falls_back_to_rerunning_when_cached_response_is_stale(client):
    """Regression test: a cache entry written by an older, incompatible schema
    must never crash /parse — it should be treated as a cache miss (see
    routes_parse.py)."""
    import hashlib

    from app.models.schema import Resume

    cache = app.dependency_overrides[get_ai_cache_collection]()
    headers = {"X-Session-Id": "session-stale-parse"}
    file_bytes = b"Ada Lovelace's resume text"
    file_hash = hashlib.sha256(file_bytes).hexdigest()

    key = cache_key("parse", "session-stale-parse", file_hash, "False")
    # Simulate a stale cache entry, e.g. from before basics.location became a
    # plain string (an earlier schema shape had it as a nested object).
    set_cached(
        cache,
        key,
        "session-stale-parse",
        "parse",
        {
            "resume": {"basics": {"location": {"city": "Springfield", "region": "MH"}}},
            "incomplete": False,
            "warnings": [],
        },
    )

    fake_resume = Resume()
    fake_resume.basics.name = "Ada Lovelace"
    with patch(
        "app.api.routes_parse.parse_resume_text",
        return_value={"resume": fake_resume, "incomplete": False, "warnings": []},
    ) as mock_parse, patch(
        "app.api.routes_parse.extract_text", return_value="Ada Lovelace's resume text"
    ):
        response = client.post(
            "/parse",
            files={"file": ("resume.txt", file_bytes, "text/plain")},
            headers=headers,
        )

    assert response.status_code == 200
    assert response.json()["resume"]["basics"]["name"] == "Ada Lovelace"
    mock_parse.assert_called_once()
