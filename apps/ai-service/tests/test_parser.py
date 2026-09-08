import base64
from unittest.mock import MagicMock, patch

from app.agents.parser_graph import _LLMResume, _to_resume, structure_node
from app.models.schema import Resume


def test_structure_node_prefers_masked_text_over_raw_text():
    """The Structurer must only ever see masked text when it's available —
    that's the whole point of the PII Masking & Anonymization Engine step."""
    fake_structured = MagicMock()
    fake_structured.invoke.return_value = _LLMResume()
    fake_llm = MagicMock()
    fake_llm.with_structured_output.return_value = fake_structured

    with patch("app.agents.parser_graph.get_llm", return_value=fake_llm):
        structure_node(
            {"raw_text": "Ada Lovelace's resume", "masked_text": "<PERSON_1>'s resume"}
        )

    prompt = fake_structured.invoke.call_args.args[0]
    assert "<PERSON_1>'s resume" in prompt
    assert "Ada Lovelace" not in prompt


def test_to_resume_converts_plain_text_fields_into_richtext_entries():
    llm_resume = _LLMResume.model_validate(
        {
            "basics": {"name": "Ada Lovelace"},
            "summary": {"content": "Line one\nLine two"},
            "sections": {
                "experience": [{"position": "Analyst", "description": "Did things"}],
                "projects": [{"name": "Engine", "description": "Built a thing"}],
            },
        }
    )
    resume = _to_resume(llm_resume)

    assert resume.basics.name == "Ada Lovelace"
    assert [e.html for e in resume.summary.content] == ["Line one", "Line two"]
    assert resume.sections.experience.items[0].description[0].html == "Did things"
    assert resume.sections.projects.items[0].description[0].html == "Built a thing"


def test_structure_node_uses_improve_prompt_when_requested():
    fake_structured = MagicMock()
    fake_structured.invoke.return_value = _LLMResume()
    fake_llm = MagicMock()
    fake_llm.with_structured_output.return_value = fake_structured

    with patch("app.agents.parser_graph.get_llm", return_value=fake_llm):
        structure_node({"raw_text": "some resume text", "improve": False})
        structure_node({"raw_text": "some resume text", "improve": True})

    prompts = [call.args[0] for call in fake_structured.invoke.call_args_list]
    assert "Preserve the original wording exactly" in prompts[0]
    assert "Refine the summary and bullet points" in prompts[1]


def test_structure_node_retries_and_merges_sections_dropped_on_a_bad_attempt():
    """Regression test: smaller models (e.g. gpt-5-nano) sometimes drop entire
    sections from their structured output on a given attempt even though the
    source text clearly has them. structure_node should retry and merge in
    whatever a later attempt recovers, rather than losing that data."""
    first_attempt = _LLMResume.model_validate(
        {
            "basics": {"name": "Ada Lovelace"},
            "sections": {"experience": [{"position": "Engineer"}]},
        }
    )
    second_attempt = _LLMResume.model_validate(
        {
            "sections": {
                "education": [{"school": "Cambridge"}],
                "skills": [{"name": "Python"}],
            }
        }
    )
    fake_structured = MagicMock()
    fake_structured.invoke.side_effect = [first_attempt, second_attempt]
    fake_llm = MagicMock()
    fake_llm.with_structured_output.return_value = fake_structured

    raw_text = "Experience\nEngineer\n\nEducation\nCambridge\n\nSkills\nPython"
    with patch("app.agents.parser_graph.get_llm", return_value=fake_llm):
        result = structure_node({"raw_text": raw_text})

    assert fake_structured.invoke.call_count == 2
    assert result["incomplete"] is False
    resume = result["resume"]
    assert resume.basics.name == "Ada Lovelace"
    assert resume.sections.experience.items[0].position == "Engineer"
    assert resume.sections.education.items[0].school == "Cambridge"
    assert resume.sections.skills.items[0].name == "Python"


def test_structure_node_stops_retrying_once_nothing_more_to_recover():
    """If the source text doesn't mention a section at all (e.g. no
    education), a single empty result shouldn't trigger pointless retries."""
    fake_structured = MagicMock()
    fake_structured.invoke.return_value = _LLMResume.model_validate(
        {"basics": {"name": "Ada Lovelace"}}
    )
    fake_llm = MagicMock()
    fake_llm.with_structured_output.return_value = fake_structured

    with patch("app.agents.parser_graph.get_llm", return_value=fake_llm):
        structure_node({"raw_text": "Just a name, nothing else."})

    assert fake_structured.invoke.call_count == 1


def test_structure_node_falls_back_to_empty_resume_on_llm_failure():
    fake_llm = MagicMock()
    fake_llm.with_structured_output.return_value.invoke.side_effect = RuntimeError(
        "boom"
    )

    with patch("app.agents.parser_graph.get_llm", return_value=fake_llm):
        result = structure_node({"raw_text": "some resume text"})

    assert result["incomplete"] is True
    assert "AI structuring failed" in result["warnings"][0]
    assert result["resume"].basics.name == ""


def test_parse_route_applies_the_uploaded_files_embedded_photo(client):
    """Regression test: if the uploaded resume file has an embedded photo,
    /parse should carry it over onto the resulting Resume's picture.url (as
    a base64 data URI) — see app/api/routes_parse.py's _apply_photo."""
    fake_resume = Resume()
    fake_resume.basics.name = "Ada Lovelace"
    photo_bytes = b"\xff\xd8\xff" + b"fake-jpeg-bytes"

    with (
        patch(
            "app.api.routes_parse.extract_text",
            return_value="Ada Lovelace's resume text",
        ),
        patch(
            "app.api.routes_parse.extract_photo",
            return_value=("image/jpeg", photo_bytes),
        ),
        patch(
            "app.api.routes_parse.parse_resume_text",
            return_value={"resume": fake_resume, "incomplete": False, "warnings": []},
        ),
    ):
        response = client.post(
            "/parse",
            files={"file": ("resume.pdf", b"irrelevant bytes", "application/pdf")},
            headers={"X-Session-Id": "session-with-photo"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["resume"]["basics"]["name"] == "Ada Lovelace"
    assert body["resume"]["picture"]["hidden"] is False
    expected_url = f"data:image/jpeg;base64,{base64.b64encode(photo_bytes).decode()}"
    assert body["resume"]["picture"]["url"] == expected_url


def test_parse_route_leaves_picture_empty_when_the_file_has_no_photo(client):
    fake_resume = Resume()
    fake_resume.basics.name = "Ada Lovelace"

    with (
        patch(
            "app.api.routes_parse.extract_text",
            return_value="Ada Lovelace's resume text",
        ),
        patch("app.api.routes_parse.extract_photo", return_value=None),
        patch(
            "app.api.routes_parse.parse_resume_text",
            return_value={"resume": fake_resume, "incomplete": False, "warnings": []},
        ),
    ):
        response = client.post(
            "/parse",
            files={"file": ("resume.pdf", b"irrelevant bytes", "application/pdf")},
            headers={"X-Session-Id": "session-without-photo"},
        )

    assert response.status_code == 200
    assert response.json()["resume"]["picture"]["url"] == ""


def test_parse_route_accepts_pasted_text_instead_of_a_file(client):
    """Regression test: the "paste your resume" flow posts `text` (no
    `file`) — /parse should parse that text directly via the same pipeline,
    skipping file/photo extraction entirely."""
    fake_resume = Resume()
    fake_resume.basics.name = "Ada Lovelace"

    with (
        patch("app.api.routes_parse.extract_text") as mock_extract_text,
        patch("app.api.routes_parse.extract_photo") as mock_extract_photo,
        patch(
            "app.api.routes_parse.parse_resume_text",
            return_value={"resume": fake_resume, "incomplete": False, "warnings": []},
        ) as mock_parse,
    ):
        response = client.post(
            "/parse",
            data={"text": "Ada Lovelace's resume text, pasted directly."},
            headers={"X-Session-Id": "session-pasted-text"},
        )

    assert response.status_code == 200
    assert response.json()["resume"]["basics"]["name"] == "Ada Lovelace"
    mock_parse.assert_called_once_with(
        "Ada Lovelace's resume text, pasted directly.", improve=False
    )
    mock_extract_text.assert_not_called()
    mock_extract_photo.assert_not_called()


def test_parse_route_rejects_requests_with_neither_file_nor_text(client):
    response = client.post(
        "/parse", data={}, headers={"X-Session-Id": "session-empty-parse"}
    )
    assert response.status_code == 400


def test_parse_route_rejects_blank_pasted_text(client):
    response = client.post(
        "/parse",
        data={"text": "   "},
        headers={"X-Session-Id": "session-blank-text"},
    )
    assert response.status_code == 400
