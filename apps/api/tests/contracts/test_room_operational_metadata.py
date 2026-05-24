import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import NO_PHI_RUNTIME_REJECTION_CODE, PlanContract

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def assert_runtime_rejection(payload: dict, rejected_value: str) -> None:
    with pytest.raises(ValidationError) as exc_info:
        PlanContract.model_validate(payload)
    message = str(exc_info.value)
    assert NO_PHI_RUNTIME_REJECTION_CODE in message
    assert rejected_value not in message


def test_room_operational_metadata_validates_in_er_pod_fixture() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))

    assert [room.roomOperationalMetadata.roomClass for room in plan.rooms] == [
        "standard",
        "trauma",
        "isolation",
        "behavioral",
        "procedure",
        "overflow",
        "hall_bed",
    ]
    assert plan.rooms[1].roomOperationalMetadata.traumaAdjacent is True
    assert plan.rooms[2].roomOperationalMetadata.isolationReady is True
    assert plan.rooms[3].roomOperationalMetadata.behavioralReady is True


def test_room_operational_metadata_rejects_invalid_enum_and_free_text_field() -> None:
    invalid_enum = load_fixture("plan-er-pod-phase2.json")
    invalid_enum["rooms"][0]["roomOperationalMetadata"]["roomClass"] = "resuscitation"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(invalid_enum)

    rejected_value = "Narrative room metadata"
    free_text = load_fixture("plan-er-pod-phase2.json")
    free_text["rooms"][0]["roomOperationalMetadata"]["freeText"] = rejected_value
    with pytest.raises(ValidationError) as exc_info:
        PlanContract.model_validate(free_text)
    assert rejected_value not in str(exc_info.value)


def test_room_operational_metadata_and_labels_remain_no_phi_guarded() -> None:
    rejected_room_number = "D" + "OB 01/02/1980"
    bad_room_number = load_fixture("plan-er-pod-phase2.json")
    bad_room_number["rooms"][0]["roomOperationalMetadata"]["roomNumber"] = rejected_room_number
    assert_runtime_rejection(bad_room_number, rejected_room_number)

    rejected_label = "John" + " " + "Smith"
    bad_label = load_fixture("plan-er-pod-phase2.json")
    bad_label["rooms"][0]["label"] = rejected_label
    assert_runtime_rejection(bad_label, rejected_label)


def test_existing_room_geometry_fields_remain_unchanged() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))

    assert plan.rooms[0].widthFeet == 12
    assert plan.rooms[0].lengthFeet == 10
    assert plan.rooms[0].doorPoint.x == 10
    assert plan.rooms[0].doorPoint.y == 14
