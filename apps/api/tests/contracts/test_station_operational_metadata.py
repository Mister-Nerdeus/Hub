import json
from copy import deepcopy
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import PlanContract

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def test_station_operational_metadata_validates_in_er_pod_fixture() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))
    station = plan.nurseStations[0]

    assert station.stationOperationalMetadata.stationClass == "primary"
    assert station.stationOperationalMetadata.supportsChargeNurse is True
    assert station.stationOperationalMetadata.supportsPrimaryNurse is True
    assert station.stationOperationalMetadata.supportsProvider is True
    assert station.stationOperationalMetadata.supportsTriage is False
    assert station.stationOperationalMetadata.visibilityLevel == "high"
    assert station.stationOperationalMetadata.defaultWalkingOrigin is True


def test_station_operational_metadata_rejects_invalid_enum_and_forbidden_fields() -> None:
    invalid_class = load_fixture("plan-er-pod-phase2.json")
    invalid_class["nurseStations"][0]["stationOperationalMetadata"]["stationClass"] = "desk"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(invalid_class)

    rejected_value = "Narrative station metadata"
    free_text = load_fixture("plan-er-pod-phase2.json")
    free_text["nurseStations"][0]["stationOperationalMetadata"]["freeText"] = rejected_value
    with pytest.raises(ValidationError) as exc_info:
        PlanContract.model_validate(free_text)
    assert rejected_value not in str(exc_info.value)

    staff_identity = load_fixture("plan-er-pod-phase2.json")
    staff_identity["nurseStations"][0]["stationOperationalMetadata"]["staffName"] = "Synthetic Staff"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(staff_identity)

    schedule = load_fixture("plan-er-pod-phase2.json")
    schedule["nurseStations"][0]["stationOperationalMetadata"]["shiftSchedule"] = "Synthetic schedule"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(schedule)


def test_station_metadata_preserves_path_node_linkage_and_geometry() -> None:
    fixture = load_fixture("plan-er-pod-phase2.json")
    plan = PlanContract.model_validate(fixture)
    stripped_fixture = deepcopy(fixture)
    for station in stripped_fixture["nurseStations"]:
        station.pop("stationOperationalMetadata", None)
    plan_without_metadata = PlanContract.model_validate(stripped_fixture)

    assert [
        (station.id, station.x, station.y, station.widthFeet, station.lengthFeet, station.pathNodeId)
        for station in plan.nurseStations
    ] == [
        (station.id, station.x, station.y, station.widthFeet, station.lengthFeet, station.pathNodeId)
        for station in plan_without_metadata.nurseStations
    ]
    for station in plan.nurseStations:
        path_node = next(node for node in plan.pathNodes if node.id == station.pathNodeId)
        assert path_node.nodeType == "station"
        assert path_node.linkedObjectId == station.id
