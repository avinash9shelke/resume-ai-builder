from app.models.schema import RichTextEntry, richtext_from_plain, richtext_to_plain


def test_richtext_to_plain_strips_markup_and_prefixes_bullets():
    entries = [
        RichTextEntry(type="paragraph", html="Staff <strong>Engineer</strong>"),
        RichTextEntry(type="bullet", html="Led <em>AI</em> initiatives"),
        RichTextEntry(type="paragraph", html=""),
    ]
    assert richtext_to_plain(entries) == "Staff Engineer\n• Led AI initiatives"


def test_richtext_from_plain_wraps_each_line_as_a_paragraph_entry():
    entries = richtext_from_plain("Line one\n\nLine two")
    assert [e.html for e in entries] == ["Line one", "Line two"]
    assert all(e.type == "paragraph" for e in entries)
    assert all(e.id for e in entries)


def test_richtext_from_plain_maps_bullet_marked_lines_to_bullet_entries():
    """Regression test: lines starting with a bullet marker (e.g. "• ") must
    round-trip into bullet-type entries (marker stripped) so the UI renders
    them as a bulleted list instead of plain paragraphs."""
    entries = richtext_from_plain("• Led AI initiatives\n- Reduced costs by 30%")

    assert [e.html for e in entries] == ["Led AI initiatives", "Reduced costs by 30%"]
    assert all(e.type == "bullet" for e in entries)


def test_richtext_from_plain_treats_a_partially_bulleted_block_as_all_bullets():
    """Regression test: the LLM occasionally drops the "• " marker from just
    one line of an otherwise fully-bulleted description (observed on real
    resumes). A field is realistically either "all bullets" or "a
    paragraph", never a mix, so a single unmarked line shouldn't leave a
    stray paragraph in the middle of a bullet list."""
    entries = richtext_from_plain(
        "• Led AI initiatives\nReduced costs by 30%\n• Shipped on time"
    )

    assert [e.html for e in entries] == [
        "Led AI initiatives",
        "Reduced costs by 30%",
        "Shipped on time",
    ]
    assert all(e.type == "bullet" for e in entries)
