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


def test_zone_taxonomy_and_metadata_validate_in_er_pod_fixture() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))

    assert [zone.zoneType for zone in plan.zones] == [
        "provider_area",
        "hallway",
        "trauma_zone",
        "ems_entry",
        "supply_storage",
    ]
    assert plan.zones[0].zoneOperationalMetadata.zoneClass == "patient_care"
    assert plan.zones[1].zoneOperationalMetadata.supportsPatientFlow is True
    assert plan.zones[4].zoneOperationalMetadata.staffOnly is True


def test_zone_taxonomy_and_metadata_reject_invalid_enum_and_free_text_field() -> None:
    invalid_type = load_fixture("plan-er-pod-phase2.json")
    invalid_type["zones"][0]["zoneType"] = "storage"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(invalid_type)

    invalid_class = load_fixture("plan-er-pod-phase2.json")
    invalid_class["zones"][0]["zoneOperationalMetadata"]["zoneClass"] = "clinical"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(invalid_class)

    rejected_value = "Narrative zone metadata"
    free_text = load_fixture("plan-er-pod-phase2.json")
    free_text["zones"][0]["zoneOperationalMetadata"]["freeText"] = rejected_value
    with pytest.raises(ValidationError) as exc_info:
        PlanContract.model_validate(free_text)
    assert rejected_value not in str(exc_info.value)


def test_zone_labels_remain_no_phi_guarded() -> None:
    rejected_label = "John" + " " + "Smith"
    bad_label = load_fixture("plan-er-pod-phase2.json")
    bad_label["zones"][0]["label"] = rejected_label

    with pytest.raises(ValidationError) as exc_info:
        PlanContract.model_validate(bad_label)
    message = str(exc_info.value)
    assert NO_PHI_RUNTIME_REJECTION_CODE in message
    assert rejected_label not in message
