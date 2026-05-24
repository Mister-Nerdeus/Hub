import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import PlanContract

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def entry_node(plan: dict) -> dict:
    return next(node for node in plan["pathNodes"] if node["nodeType"] == "entry")


def test_entry_operational_metadata_validates_in_er_pod_fixture() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))
    entry = next(node for node in plan.pathNodes if node.nodeType == "entry")
    trauma_zone = next(zone for zone in plan.zones if zone.id == entry.entryOperationalMetadata.preferredTraumaZoneId)

    assert entry.entryOperationalMetadata.entryClass == "ems"
    assert entry.entryOperationalMetadata.preferredFlowDirection == "inbound"
    assert entry.entryOperationalMetadata.preferredTraumaZoneId == "zone-trauma"
    assert entry.entryOperationalMetadata.linkedPathNodeId == "node-hall-west"
    assert trauma_zone.zoneType == "trauma_zone"


def test_entry_operational_metadata_rejects_invalid_enum_and_free_text_field() -> None:
    invalid_class = load_fixture("plan-er-pod-phase2.json")
    entry_node(invalid_class)["entryOperationalMetadata"]["entryClass"] = "patient_arrival"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(invalid_class)

    rejected_value = "Narrative entry metadata"
    free_text = load_fixture("plan-er-pod-phase2.json")
    entry_node(free_text)["entryOperationalMetadata"]["freeText"] = rejected_value
    with pytest.raises(ValidationError) as exc_info:
        PlanContract.model_validate(free_text)
    assert rejected_value not in str(exc_info.value)

    non_entry = load_fixture("plan-er-pod-phase2.json")
    non_entry["pathNodes"][0]["entryOperationalMetadata"] = {
        "entryClass": "ems",
        "preferredFlowDirection": "inbound",
        "preferredTraumaZoneId": "zone-trauma",
        "linkedPathNodeId": "node-ems-entry",
    }
    with pytest.raises(ValidationError):
        PlanContract.model_validate(non_entry)


def test_entry_operational_metadata_rejects_unknown_references() -> None:
    unknown_zone = load_fixture("plan-er-pod-phase2.json")
    entry_node(unknown_zone)["entryOperationalMetadata"]["preferredTraumaZoneId"] = "zone-missing"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(unknown_zone)

    unknown_path_node = load_fixture("plan-er-pod-phase2.json")
    entry_node(unknown_path_node)["entryOperationalMetadata"]["linkedPathNodeId"] = "node-missing"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(unknown_path_node)

    self_reference = load_fixture("plan-er-pod-phase2.json")
    entry_node(self_reference)["entryOperationalMetadata"]["linkedPathNodeId"] = "node-ems-entry"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(self_reference)
