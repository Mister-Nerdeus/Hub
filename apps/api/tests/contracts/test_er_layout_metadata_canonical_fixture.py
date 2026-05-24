import json
from pathlib import Path

from app.contracts import PlanContract

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def metadata_counts(plan: PlanContract) -> dict[str, int]:
    return {
        "roomOperationalMetadata": sum(room.roomOperationalMetadata is not None for room in plan.rooms),
        "zoneOperationalMetadata": sum(zone.zoneOperationalMetadata is not None for zone in plan.zones),
        "hallwayOperationalMetadata": sum(
            hallway.hallwayOperationalMetadata is not None for hallway in plan.hallways
        ),
        "doorOperationalMetadata": sum(door.doorOperationalMetadata is not None for door in plan.doors),
        "stationOperationalMetadata": sum(
            station.stationOperationalMetadata is not None for station in plan.nurseStations
        ),
        "entryOperationalMetadata": sum(node.entryOperationalMetadata is not None for node in plan.pathNodes),
        "overflowOperationalMetadata": sum(
            room.overflowOperationalMetadata is not None for room in plan.rooms
        ),
        "adjacencyOperationalMetadata": sum(
            room.adjacencyOperationalMetadata is not None for room in plan.rooms
        ),
    }


def room(plan: PlanContract, room_id: str):
    return next(candidate for candidate in plan.rooms if candidate.id == room_id)


def test_canonical_er_layout_fixture_represents_all_metadata_objects() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))
    counts = metadata_counts(plan)

    assert all(count > 0 for count in counts.values())
    assert room(plan, "hall-bed-01").roomType == "hall_bed"
    assert room(plan, "hall-bed-01").overflowOperationalMetadata.overflowClass == "hall_bed"
    assert room(plan, "room-02").adjacencyOperationalMetadata.traumaAdjacencyLevel == "direct"
    assert room(plan, "room-04").adjacencyOperationalMetadata.behavioralAdjacencyLevel == "direct"
