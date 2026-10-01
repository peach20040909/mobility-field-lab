import pytest
from pydantic import ValidationError
from contract import parse_result, parse_model_result, completed_result, Observation

def observation(**changes):
    return dict(kind="unknown", status="unassessable", risks=[], fallen=False, reason="brand hidden", bbox=[0.1,0.2,0.5,0.9], **changes)

def test_unknown_is_not_forced_shared():
    result = parse_result('{"observations": [{"kind":"unknown","status":"unassessable","risks":[],"fallen":false,"reason":"brand hidden","bbox":[0.1,0.2,0.5,0.9]}]}')
    assert result.observations[0].kind == "unknown"

@pytest.mark.parametrize("bbox", [[0,0,2,1], [0.5,0.2,0.1,0.8], [0,0,0,0], [0,0,1]])
def test_invalid_bbox(bbox):
    item = observation()
    item["bbox"] = bbox
    with pytest.raises(ValidationError):
        Observation.model_validate(item)

@pytest.mark.parametrize("raw", ["not json", "{}", '{"observations":[{}]}', '{"observations":[],"accuracy":99}', 'prefix {"observations":[]}'])
def test_malformed_output_rejected(raw):
    with pytest.raises((ValidationError, ValueError)):
        parse_result(raw)

def test_valid_empty_scene():
    assert parse_result('{"observations":[]}').observations == []

def test_code_fence_only():
    assert parse_result('```json\n{"observations":[]}\n```').observations == []

def test_model_coordinates_have_explicit_1000_scale():
    raw='[{"kind":"unknown","status":"normal","risks":[],"fallen":false,"reason":"branding hidden","bbox":[100,200,500,900]}]'
    assert parse_model_result(raw).observations[0].bbox == [0.1,0.2,0.5,0.9]

def test_no_repair_of_truncated_model_json():
    with pytest.raises(ValueError):
        parse_model_result('[{"bbox":[100,200,500,900]')

def test_eos_required_even_for_valid_json():
    assert completed_result("[]",151645,151645).observations == []
    with pytest.raises(ValueError):
        completed_result("[]",151643,151645)
