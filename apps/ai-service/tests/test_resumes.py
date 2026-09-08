def _sample_payload():
    return {
        "title": "My Resume",
        "basics": {"name": "Ada Lovelace", "email": "ada@example.com"},
    }


def test_create_list_get_update_delete_resume(client):
    create_res = client.post("/resumes", json=_sample_payload())
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["basics"]["name"] == "Ada Lovelace"
    resume_id = created["id"]

    list_res = client.get("/resumes")
    assert list_res.status_code == 200
    assert any(r["id"] == resume_id for r in list_res.json())

    get_res = client.get(f"/resumes/{resume_id}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "My Resume"

    updated_payload = created.copy()
    updated_payload["title"] = "Updated Title"
    update_res = client.put(f"/resumes/{resume_id}", json=updated_payload)
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Title"

    delete_res = client.delete(f"/resumes/{resume_id}")
    assert delete_res.status_code == 204

    missing_res = client.get(f"/resumes/{resume_id}")
    assert missing_res.status_code == 404


def test_get_nonexistent_resume_returns_404(client):
    response = client.get("/resumes/does-not-exist")
    assert response.status_code == 404


def test_certifications_awards_and_custom_sections_round_trip(client):
    payload = {
        "title": "Full Resume",
        "sections": {
            "certifications": {
                "items": [{"title": "PMP", "issuer": "PMI", "date": "2020"}]
            },
            "awards": {
                "items": [
                    {
                        "title": "Nobel Prize",
                        "awarder": "Nobel Committee",
                        "date": "1903",
                    }
                ]
            },
        },
        "customSections": [
            {
                "id": "custom:s1",
                "title": "Publications",
                "items": [
                    {
                        "title": "A Paper",
                        "description": [{"html": "Doctoral thesis"}],
                    }
                ],
            }
        ],
        "metadata": {
            "layout": {
                "sectionOrder": [
                    {"id": "basics", "column": 0},
                    {"id": "custom:s1", "column": 0},
                ]
            }
        },
    }
    create_res = client.post("/resumes", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["sections"]["certifications"]["items"][0]["title"] == "PMP"
    assert created["sections"]["awards"]["items"][0]["title"] == "Nobel Prize"
    assert created["customSections"][0]["title"] == "Publications"
    assert created["customSections"][0]["items"][0]["title"] == "A Paper"
    assert (
        created["customSections"][0]["items"][0]["description"][0]["html"]
        == "Doctoral thesis"
    )

    get_res = client.get(f"/resumes/{created['id']}")
    assert get_res.status_code == 200
    assert get_res.json()["customSections"][0]["id"] == "custom:s1"
