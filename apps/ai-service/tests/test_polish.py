from unittest.mock import MagicMock, patch

from app.models.schema import PolishRequest


def test_polish_returns_five_suggestions(client):
    with patch(
        "app.api.routes_polish.polish_text",
        return_value=["A", "B", "C", "D", "E"],
    ):
        response = client.post(
            "/polish",
            json={"target": "summary", "text": "Experienced engineer."},
        )
    assert response.status_code == 200
    body = response.json()
    assert len(body["suggestions"]) == 5


def test_polish_validate_node_pads_and_dedupes():
    from app.agents.polish_graph import validate_node

    suggestion_a = (
        "Experienced engineer who designs and ships reliable backend systems "
        "across distributed teams, partnering closely with product and design "
        "to deliver measurable results."
    )
    suggestion_b = (
        "Builds and maintains resilient, high-throughput services while "
        "mentoring engineers on best practices, code quality, and scalable "
        "system design across the organization."
    )
    state = {
        "request": PolishRequest(target="summary", text="Original"),
        "suggestions": [suggestion_a, suggestion_a, suggestion_b],
    }
    result = validate_node(state)
    assert len(result["suggestions"]) == 5
    assert result["suggestions"][:2] == [suggestion_a, suggestion_b]


def test_polish_validate_node_rejects_suggestions_that_collapse_bullets():
    """Regression test: a suggestion that merges/drops the original's bullet
    points must never reach the user — picking it as a full replacement
    would silently lose content (see polish_graph.py's formatting rule)."""
    from app.agents.polish_graph import validate_node

    original = "• Led the migration to microservices.\n• Reduced latency by 30%.\n• Mentored 3 engineers."
    collapsed_into_one_line = (
        "Led the migration, reduced latency by 30%, and mentored 3 engineers."
    )
    correct_shape = "• Drove the migration to microservices.\n• Cut latency by 30%.\n• Coached 3 engineers."

    state = {
        "request": PolishRequest(target="experience_description", text=original),
        "suggestions": [collapsed_into_one_line, correct_shape],
    }
    result = validate_node(state)

    assert collapsed_into_one_line not in result["suggestions"]
    assert correct_shape in result["suggestions"]


def test_polish_validate_node_keeps_single_paragraph_suggestions_as_is():
    """A plain-paragraph original (e.g. a summary) has no bullet structure to
    preserve, so a full-length paragraph suggestion should pass through."""
    from app.agents.polish_graph import validate_node

    full_paragraph = (
        "Seasoned software engineer with a decade of experience building scalable, "
        "high-availability backend systems. Led cross-functional teams to ship "
        "cloud-native platforms and mentored junior engineers along the way."
    )
    state = {
        "request": PolishRequest(target="summary", text="Experienced engineer."),
        "suggestions": [full_paragraph],
    }
    result = validate_node(state)
    assert full_paragraph in result["suggestions"]


def test_polish_validate_node_rejects_short_instructional_fragments_for_paragraphs():
    """Regression test: for non-bulleted text, the model occasionally returns
    a short meta-commentary fragment (e.g. "Keep length similar to
    original.") instead of an actual rewritten paragraph — these must never
    reach the user since there's no bullet-count mismatch to catch them."""
    from app.agents.polish_graph import validate_node

    full_paragraph = (
        "Seasoned software engineer with a decade of experience building scalable, "
        "high-availability backend systems and mentoring junior engineers."
    )
    state = {
        "request": PolishRequest(target="summary", text="Experienced engineer."),
        "suggestions": ["Keep length similar to original.", full_paragraph],
    }
    result = validate_node(state)

    assert "Keep length similar to original." not in result["suggestions"]
    assert full_paragraph in result["suggestions"]


def test_polish_node_retries_when_the_llm_returns_advice_instead_of_bullets():
    """Regression test: if the model ignores the format and returns generic
    writing advice (no bullet structure) on its first attempt, polish_node
    should retry rather than immediately giving up with zero suggestions."""
    from app.agents.polish_graph import polish_node

    bad_advice = MagicMock(
        suggestions=["Use stronger action verbs.", "Quantify your results."]
    )
    good_bullets = MagicMock(
        suggestions=[
            f"• Drove backend reliability improvements ({i}).\n"
            "• Automated deployment scripts.\n"
            "• Led code reviews."
            for i in range(5)
        ]
    )
    fake_structured = MagicMock()
    fake_structured.invoke.side_effect = [bad_advice, good_bullets]
    fake_llm = MagicMock()
    fake_llm.with_structured_output.return_value = fake_structured

    request = PolishRequest(
        target="experience_description",
        text="• Responsible for backend.\n• Wrote deployment scripts.\n• Helped with code reviews.",
    )
    with patch("app.agents.polish_graph.get_llm", return_value=fake_llm):
        result = polish_node({"request": request})

    assert fake_structured.invoke.call_count == 2
    assert len(result["suggestions"]) == 5
    assert all("•" in s for s in result["suggestions"])


def test_polish_validate_node_rejects_meta_commentary_that_matches_bullet_count():
    """Regression test: on real resumes the model sometimes returns
    meta-commentary about the rewriting task ("Preserve the key
    technologies...", "Each version must start with a bullet.") that
    coincidentally has the right number of "• "-prefixed lines to slip past
    the bullet-count check — these must still be rejected since they never
    mention any of the original's specific facts (company/tech names)."""
    from app.agents.polish_graph import validate_node

    original = (
        "• Architected and built the HMH Coachly platform using cloud-native, "
        "event-driven microservices on AWS.\n"
        "• Integrated Zoom and Salesforce to enhance coaching and scheduling workflows."
    )
    generic_advice_with_bullets = (
        "• Provide five two-line rewritten bullets for the given two bullets.\n"
        "• Each version must start with a bullet and keep the original order."
    )
    real_rewrite = (
        "• Led the architecture and delivery of the HMH Coachly platform, built on "
        "cloud-native, event-driven microservices on AWS.\n"
        "• Spearheaded Zoom and Salesforce integrations to streamline coaching and "
        "scheduling workflows."
    )
    state = {
        "request": PolishRequest(target="experience_description", text=original),
        "suggestions": [generic_advice_with_bullets, real_rewrite],
    }
    result = validate_node(state)

    assert generic_advice_with_bullets not in result["suggestions"]
    assert real_rewrite in result["suggestions"]


def test_polish_node_tells_the_llm_the_exact_bullet_count_to_preserve():
    fake_structured = MagicMock()
    fake_structured.invoke.return_value = MagicMock(suggestions=["x"] * 5)
    fake_llm = MagicMock()
    fake_llm.with_structured_output.return_value = fake_structured

    from app.agents.polish_graph import polish_node

    request = PolishRequest(
        target="experience_description",
        text="• Built a thing.\n• Shipped a thing.\n• Fixed a thing.",
    )
    with patch("app.agents.polish_graph.get_llm", return_value=fake_llm):
        polish_node({"request": request})

    prompt = fake_structured.invoke.call_args.args[0]
    assert "exactly 3 lines" in prompt
    assert "never invent new facts" in prompt
