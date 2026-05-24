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


def with_metadata_placeholders() -> dict:
    plan = load_fixture("plan-er-pod-phase2.json")
    plan["rooms"][0]["overflowOperationalMetadata"] = {}
    plan["rooms"][0]["adjacencyOperationalMetadata"] = {}
    return plan


def test_er_layout_metadata_architecture_accepts_optional_nested_placeholders() -> None:
    plan = PlanContract.model_validate(with_metadata_placeholders())

    assert plan.rooms[0].roomOperationalMetadata is not None
    assert plan.rooms[0].roomOperationalMetadata.roomClass == "standard"
    assert plan.rooms[0].overflowOperationalMetadata is not None
    assert plan.rooms[0].adjacencyOperationalMetadata is not None
    assert plan.hallways[0].hallwayOperationalMetadata is not None
    assert plan.hallways[0].hallwayOperationalMetadata.hallwayClass == "main"
    assert plan.doors[0].doorOperationalMetadata is not None
    assert plan.doors[0].doorOperationalMetadata.doorClass == "standard"
    assert plan.nurseStations[0].stationOperationalMetadata is not None
    assert plan.nurseStations[0].stationOperationalMetadata.stationClass == "primary"
    assert plan.zones[0].zoneOperationalMetadata is not None
    assert plan.zones[0].zoneOperationalMetadata.zoneClass == "patient_care"
    entry_node = next(node for node in plan.pathNodes if node.nodeType == "entry")
    assert entry_node.entryOperationalMetadata is not None
    assert entry_node.entryOperationalMetadata.entryClass == "ems"


def test_er_layout_metadata_architecture_rejects_sprawl_and_narrative_fields() -> None:
    top_level_sprawl = load_fixture("plan-er-pod-phase2.json")
    top_level_sprawl["rooms"][0]["roomClass"] = "trauma"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(top_level_sprawl)

    rejected_value = "Narrative metadata text"
    narrative_metadata = with_metadata_placeholders()
    narrative_metadata["rooms"][0]["roomOperationalMetadata"] = {
        **narrative_metadata["rooms"][0]["roomOperationalMetadata"],
        "noteText": rejected_value,
    }
    with pytest.raises(ValidationError) as exc_info:
        PlanContract.model_validate(narrative_metadata)
    assert rejected_value not in str(exc_info.value)


def test_existing_er_layout_fixtures_remain_valid_without_metadata() -> None:
    assert PlanContract.model_validate(load_fixture("plan-basic.json")).planId == "plan-basic"
    assert (
        PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json")).planId
        == "plan-er-pod-phase2"
    )
