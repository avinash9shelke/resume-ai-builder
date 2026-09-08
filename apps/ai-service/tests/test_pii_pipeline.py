from unittest.mock import MagicMock, patch

import httpx

from app.agents.parser_graph import (
    _LLMResume,
    build_parser_graph,
    mask_node,
    unmask_node,
)
from app.models.schema import Resume
from app.services import pii_client


class _FakeResponse:
    def __init__(self, json_body: dict):
        self._json = json_body

    def raise_for_status(self) -> None:
        pass

    def json(self) -> dict:
        return self._json


def test_pii_client_mask_returns_masked_text_and_mapping_id_on_success():
    fake_response = _FakeResponse(
        {"masked_text": "<PERSON_1> is an engineer", "mapping_id": "abc"}
    )
    with patch("app.services.pii_client.httpx.post", return_value=fake_response):
        masked_text, mapping_id = pii_client.mask("Ada is an engineer")

    assert masked_text == "<PERSON_1> is an engineer"
    assert mapping_id == "abc"


def test_pii_client_mask_falls_back_to_raw_text_when_service_is_unreachable():
    with patch(
        "app.services.pii_client.httpx.post", side_effect=httpx.ConnectError("boom")
    ):
        masked_text, mapping_id = pii_client.mask("Ada is an engineer")

    assert masked_text == "Ada is an engineer"
    assert mapping_id is None


def test_pii_client_unmask_returns_data_unchanged_without_a_mapping_id():
    assert pii_client.unmask({"name": "<PERSON_1>"}, None) == {"name": "<PERSON_1>"}


def test_pii_client_unmask_falls_back_to_original_data_when_service_is_unreachable():
    data = {"name": "<PERSON_1>"}
    with patch(
        "app.services.pii_client.httpx.post", side_effect=httpx.ConnectError("boom")
    ):
        result = pii_client.unmask(data, "some-mapping-id")

    assert result == data


def test_mask_node_populates_masked_text_and_mapping_id():
    with patch(
        "app.agents.parser_graph.pii_client.mask",
        return_value=("<PERSON_1>'s resume", "mapping-1"),
    ):
        result = mask_node({"raw_text": "Ada Lovelace's resume"})

    assert result == {"masked_text": "<PERSON_1>'s resume", "mapping_id": "mapping-1"}


def test_unmask_node_hydrates_pii_placeholders_in_the_validated_resume():
    resume = Resume.model_validate(
        {"basics": {"name": "<PERSON_1>", "email": "<EMAIL_ADDRESS_1>"}}
    )
    state = {"resume": resume, "mapping_id": "mapping-1"}

    with patch(
        "app.agents.parser_graph.pii_client.unmask",
        return_value={
            **resume.model_dump(),
            "basics": {
                **resume.model_dump()["basics"],
                "name": "Ada Lovelace",
                "email": "ada@example.com",
            },
        },
    ):
        result = unmask_node(state)

    assert result["resume"].basics.name == "Ada Lovelace"
    assert result["resume"].basics.email == "ada@example.com"


def test_unmask_node_strips_a_bullet_marker_reintroduced_by_unmasking():
    """Regression test: PII masking can swallow a leading "• " into the same
    placeholder span as the text after it (e.g. misreading "Integrated Zoom"
    as a location), so richtext_from_plain never sees the marker at
    structuring time — but unmasking then rehydrates the real text with the
    "• " still attached, leaving it embedded in `html` even though `type`
    was already "bullet" (from the rest of the block). unmask_node should
    strip that leftover marker rather than doubling up on the UI's bullet."""
    resume = Resume.model_validate(
        {
            "sections": {
                "experience": {
                    "items": [
                        {
                            "description": [
                                {"type": "bullet", "html": "Did one thing"},
                                {
                                    "type": "bullet",
                                    "html": "<LOCATION_4> to enhance workflows",
                                },
                            ]
                        }
                    ]
                }
            }
        }
    )
    state = {"resume": resume, "mapping_id": "mapping-1"}

    unmasked = resume.model_dump()
    unmasked["sections"]["experience"]["items"][0]["description"][1][
        "html"
    ] = "• Integrated Zoom to enhance workflows"

    with patch("app.agents.parser_graph.pii_client.unmask", return_value=unmasked):
        result = unmask_node(state)

    entries = result["resume"].sections.experience.items[0].description
    assert entries[1].html == "Integrated Zoom to enhance workflows"
    assert entries[1].type == "bullet"


def test_unmask_node_is_a_no_op_without_a_mapping_id():
    resume = Resume.model_validate({"basics": {"name": "Ada Lovelace"}})
    assert unmask_node({"resume": resume, "mapping_id": None}) == {}


def test_full_parser_graph_masks_before_the_llm_and_unmasks_the_final_resume():
    """End-to-end: raw text containing PII -> masked before reaching the LLM
    -> the LLM's (masked) structured output -> unmasked back to real PII in
    the final Resume returned to the UI."""
    fake_structured = MagicMock()

    def fake_invoke(prompt: str) -> _LLMResume:
        assert "Ada Lovelace" not in prompt
        assert "<PERSON_1>" in prompt
        return _LLMResume.model_validate({"basics": {"name": "<PERSON_1>"}})

    fake_structured.invoke.side_effect = fake_invoke
    fake_llm = MagicMock()
    fake_llm.with_structured_output.return_value = fake_structured

    def fake_mask(raw_text: str):
        return raw_text.replace("Ada Lovelace", "<PERSON_1>"), "mapping-1"

    def fake_unmask(data, mapping_id):
        assert mapping_id == "mapping-1"
        return {**data, "basics": {**data["basics"], "name": "Ada Lovelace"}}

    with (
        patch("app.agents.parser_graph.get_llm", return_value=fake_llm),
        patch("app.agents.parser_graph.pii_client.mask", side_effect=fake_mask),
        patch("app.agents.parser_graph.pii_client.unmask", side_effect=fake_unmask),
    ):
        graph = build_parser_graph()
        result = graph.invoke(
            {"raw_text": "Ada Lovelace is an engineer.", "improve": False}
        )

    assert result["resume"].basics.name == "Ada Lovelace"
    assert result["incomplete"] is False
