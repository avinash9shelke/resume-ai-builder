def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_mask_then_unmask_round_trips_a_json_payload(client):
    mask_res = client.post("/mask", json={"text": "Ada Lovelace, ada@example.com"})
    assert mask_res.status_code == 200
    body = mask_res.json()
    mapping_id = body["mapping_id"]
    masked_text = body["masked_text"]

    assert "Ada Lovelace" not in masked_text
    assert "ada@example.com" not in masked_text

    resume_like_payload = {
        "basics": {"name": masked_text.split(",")[0].strip()},
        "note": masked_text,
    }
    unmask_res = client.post(
        "/unmask", json={"mapping_id": mapping_id, "data": resume_like_payload}
    )
    assert unmask_res.status_code == 200
    unmasked = unmask_res.json()["data"]
    assert unmasked["basics"]["name"] == "Ada Lovelace"
    assert unmasked["note"] == "Ada Lovelace, ada@example.com"


def test_unmask_with_unknown_mapping_id_returns_data_unchanged(client):
    response = client.post(
        "/unmask", json={"mapping_id": "does-not-exist", "data": {"name": "<PERSON_1>"}}
    )
    assert response.status_code == 200
    assert response.json()["data"] == {"name": "<PERSON_1>"}
