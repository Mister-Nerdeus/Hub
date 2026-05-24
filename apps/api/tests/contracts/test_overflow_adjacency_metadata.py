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


def room(plan: dict, room_id: str) -> dict:
    return next(candidate for candidate in plan["rooms"] if candidate["id"] == room_id)


def test_overflow_and_adjacency_metadata_validate_in_er_pod_fixture() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))

    hall_bed = next(candidate for candidate in plan.rooms if candidate.id == "hall-bed-01")
    overflow = next(candidate for candidate in plan.rooms if candidate.id == "room-06")
    trauma_adjacent = next(candidate for candidate in plan.rooms if candidate.id == "room-02")
    behavioral_adjacent = next(candidate for candidate in plan.rooms if candidate.id == "room-04")

    assert hall_bed.overflowOperationalMetadata.overflowClass == "hall_bed"
    assert overflow.overflowOperationalMetadata.overflowClass == "surge_space"
    assert trauma_adjacent.adjacencyOperationalMetadata.traumaAdjacencyLevel == "direct"
    assert behavioral_adjacent.adjacencyOperationalMetadata.behavioralAdjacencyLevel == "direct"


def test_overflow_and_adjacency_metadata_reject_unknown_references_and_free_text() -> None:
    unknown_hallway = load_fixture("plan-er-pod-phase2.json")
    room(unknown_hallway, "room-06")["overflowOperationalMetadata"]["nearbyHallwayId"] = "hallway-missing"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(unknown_hallway)

    unknown_station = load_fixture("plan-er-pod-phase2.json")
    room(unknown_station, "room-06")["overflowOperationalMetadata"]["nearbyStationId"] = "station-missing"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(unknown_station)

    unknown_zone = load_fixture("plan-er-pod-phase2.json")
    room(unknown_zone, "room-02")["adjacencyOperationalMetadata"]["nearbySupportZoneIds"] = ["zone-missing"]
    with pytest.raises(ValidationError):
        PlanContract.model_validate(unknown_zone)

    rejected_value = "Narrative adjacency metadata"
    free_text = load_fixture("plan-er-pod-phase2.json")
    room(free_text, "room-02")["adjacencyOperationalMetadata"]["freeText"] = rejected_value
    with pytest.raises(ValidationError) as exc_info:
        PlanContract.model_validate(free_text)
    assert rejected_value not in str(exc_info.value)
