def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_score_endpoint_returns_breakdown_for_a_resume(client):
    resume = {
        "basics": {
            "name": "Ada Lovelace",
            "email": "ada@example.com",
            "phone": "555-1234",
            "location": "London, UK",
            "website": {"url": "https://ada.dev"},
        },
        "summary": {
            "content": [
                {
                    "html": (
                        "Pioneering software engineer with a decade of experience designing "
                        "algorithms and leading technical teams to deliver ambitious, high-impact "
                        "computing projects across research and industry."
                    )
                }
            ]
        },
        "sections": {
            "experience": {
                "items": [
                    {
                        "description": [
                            {
                                "html": "Led the design of the first published computer algorithm."
                            },
                            {
                                "html": "Increased team output by 25% through mentorship."
                            },
                        ]
                    }
                ]
            },
            "skills": {
                "items": [{"name": s} for s in ["Python", "Math", "Leadership"]]
            },
            "education": {"items": [{"institution": "University"}]},
        },
    }

    response = client.post("/score", json=resume)
    assert response.status_code == 200
    body = response.json()
    assert 0 <= body["overallScore"] <= 100
    assert len(body["categories"]) == 6
    assert isinstance(body["highlightedSections"], list)


def test_score_endpoint_handles_empty_resume(client):
    response = client.post("/score", json={})
    assert response.status_code == 200
    body = response.json()
    assert body["overallScore"] < 30
