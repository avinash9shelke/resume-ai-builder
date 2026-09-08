from app.services.masking import mask_text, unmask_value


def test_mask_text_replaces_person_email_and_phone_with_placeholders():
    text = "Ada Lovelace can be reached at ada@example.com."
    masked, mapping = mask_text(text)

    assert "Ada Lovelace" not in masked
    assert "ada@example.com" not in masked
    assert "<PERSON_1>" in masked
    assert "<EMAIL_ADDRESS_1>" in masked
    assert mapping["<PERSON_1>"] == "Ada Lovelace"
    assert mapping["<EMAIL_ADDRESS_1>"] == "ada@example.com"


def test_mask_text_reuses_the_same_placeholder_for_repeated_mentions():
    text = "Ada Lovelace is an engineer. We should hire Ada Lovelace."
    masked, mapping = mask_text(text)

    assert masked.count("<PERSON_1>") == 2
    assert "Ada Lovelace" not in masked
    assert len(mapping) == 1


def test_mask_text_round_trips_back_to_the_original_via_unmask_value():
    text = "Grace Hopper, grace@example.com, +1 415 555 0100, lives in New York."
    masked, mapping = mask_text(text)

    assert unmask_value(masked, mapping) == text


def test_mask_text_preserves_dates_and_organizations():
    # Dates/companies must stay intact — the LLM needs them to correctly
    # extract employment history; only personal-identity PII is masked.
    text = "Worked at Acme Corp from 2020-01 to 2023-01."
    masked, _ = mask_text(text)

    assert "Acme Corp" in masked
    assert "2020-01" in masked
    assert "2023-01" in masked


def test_mask_text_handles_empty_string():
    masked, mapping = mask_text("")
    assert masked == ""
    assert mapping == {}


def test_unmask_value_recurses_through_nested_json():
    mapping = {"<PERSON_1>": "Ada Lovelace", "<EMAIL_ADDRESS_1>": "ada@example.com"}
    data = {
        "basics": {"name": "<PERSON_1>", "email": "<EMAIL_ADDRESS_1>"},
        "work": [{"summary": "Managed by <PERSON_1>."}],
    }

    result = unmask_value(data, mapping)

    assert result["basics"]["name"] == "Ada Lovelace"
    assert result["basics"]["email"] == "ada@example.com"
    assert result["work"][0]["summary"] == "Managed by Ada Lovelace."


def test_unmask_value_is_a_no_op_without_a_mapping():
    data = {"name": "<PERSON_1>"}
    assert unmask_value(data, {}) == data
