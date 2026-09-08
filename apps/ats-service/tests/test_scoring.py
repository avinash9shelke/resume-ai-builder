from app.scoring import compute_score

EMPTY_RESUME: dict = {"basics": {}, "summary": {}, "sections": {}}


def _bullet(html: str) -> dict:
    return {"id": "b1", "type": "bullet", "html": html}


def test_empty_resume_scores_low_and_highlights_every_scored_section():
    result = compute_score(EMPTY_RESUME)

    assert result.overallScore < 20
    assert set(result.highlightedSections) >= {
        "basics",
        "summary",
        "experience",
        "skills",
        "education",
    }
    experience = next(c for c in result.categories if c.id == "experience_impact")
    assert experience.status == "critical"


def test_contact_info_scores_full_marks_when_all_fields_present():
    resume = {
        **EMPTY_RESUME,
        "basics": {
            "email": "a@example.com",
            "phone": "555-1234",
            "location": "Remote",
            "website": {"url": "https://example.com"},
        },
    }
    result = compute_score(resume)
    contact = next(c for c in result.categories if c.id == "contact_info")
    assert contact.score == 100
    assert contact.status == "good"
    assert "basics" not in result.highlightedSections


def test_summary_word_count_thresholds():
    too_short = {**EMPTY_RESUME, "summary": {"content": [{"html": "Engineer."}]}}
    just_right = {
        **EMPTY_RESUME,
        "summary": {
            "content": [
                {
                    "html": (
                        "Experienced backend engineer with a decade of expertise in distributed "
                        "systems, cloud infrastructure, and leading cross-functional teams to ship "
                        "reliable, high-throughput services for millions of daily users worldwide."
                    )
                }
            ]
        },
    }

    short_result = compute_score(too_short)
    good_result = compute_score(just_right)

    short_summary = next(c for c in short_result.categories if c.id == "summary")
    good_summary = next(c for c in good_result.categories if c.id == "summary")

    assert short_summary.status in ("warning", "critical")
    assert good_summary.status == "good"


def test_experience_rewards_quantified_action_oriented_bullets():
    weak = {
        **EMPTY_RESUME,
        "sections": {
            "experience": {
                "items": [
                    {"description": [_bullet("Responsible for the backend team.")]},
                ]
            }
        },
    }
    strong = {
        **EMPTY_RESUME,
        "sections": {
            "experience": {
                "items": [
                    {
                        "description": [
                            _bullet(
                                "Led a team of 5 engineers to increase throughput by 40%."
                            ),
                            _bullet(
                                "Reduced infrastructure costs by $120K annually through optimization."
                            ),
                        ]
                    },
                ]
            }
        },
    }

    weak_result = compute_score(weak)
    strong_result = compute_score(strong)

    weak_exp = next(c for c in weak_result.categories if c.id == "experience_impact")
    strong_exp = next(
        c for c in strong_result.categories if c.id == "experience_impact"
    )

    assert strong_exp.score > weak_exp.score
    assert strong_exp.status == "good"
    assert weak_exp.suggestions  # should surface actionable feedback


def test_skills_score_scales_with_count():
    few = {**EMPTY_RESUME, "sections": {"skills": {"items": [{"name": "Python"}]}}}
    many = {
        **EMPTY_RESUME,
        "sections": {"skills": {"items": [{"name": f"Skill {i}"} for i in range(10)]}},
    }

    few_result = compute_score(few)
    many_result = compute_score(many)

    few_skills = next(c for c in few_result.categories if c.id == "skills")
    many_skills = next(c for c in many_result.categories if c.id == "skills")

    assert many_skills.score > few_skills.score
    assert many_skills.status == "good"


def test_overall_score_is_weighted_average_of_categories():
    result = compute_score(EMPTY_RESUME)
    total_weight = sum(c.weight for c in result.categories)
    expected = round(sum(c.score * c.weight for c in result.categories) / total_weight)
    assert result.overallScore == expected
    assert total_weight == 100


def test_highlighted_sections_excludes_categories_without_a_section_id():
    result = compute_score(EMPTY_RESUME)
    length_category = next(
        c for c in result.categories if c.id == "length_and_structure"
    )
    assert length_category.sectionId is None
    assert None not in result.highlightedSections
