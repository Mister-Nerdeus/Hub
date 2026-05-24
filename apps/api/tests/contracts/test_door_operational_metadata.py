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


def door_path_node_snapshot(plan: PlanContract) -> list[tuple[str, str | None, str | None, str | None]]:
    snapshot = []
    for door in plan.doors:
        path_node = next(node for node in plan.pathNodes if node.id == door.pathNodeId)
        snapshot.append((door.id, door.pathNodeId, path_node.nodeType, path_node.linkedObjectId))
    return snapshot


def test_door_operational_metadata_validates_in_er_pod_fixture() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))

    assert [door.doorOperationalMetadata.doorClass for door in plan.doors] == [
        "standard",
        "isolation",
        "behavioral",
        "trauma",
        "standard",
        "standard",
        "standard",
    ]
    assert plan.doors[1].doorOperationalMetadata.isolationBoundary is True
    assert plan.doors[2].doorOperationalMetadata.behavioralBoundary is True
    assert plan.doors[3].doorOperationalMetadata.traumaAccess is True


def test_door_operational_metadata_rejects_invalid_enum_and_free_text_field() -> None:
    invalid_class = load_fixture("plan-er-pod-phase2.json")
    invalid_class["doors"][0]["doorOperationalMetadata"]["doorClass"] = "public"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(invalid_class)

    rejected_value = "Narrative door metadata"
    free_text = load_fixture("plan-er-pod-phase2.json")
    free_text["doors"][0]["doorOperationalMetadata"]["freeText"] = rejected_value
    with pytest.raises(ValidationError) as exc_info:
        PlanContract.model_validate(free_text)
    assert rejected_value not in str(exc_info.value)


def test_door_metadata_preserves_path_node_links_and_room_geometry() -> None:
    fixture = load_fixture("plan-er-pod-phase2.json")
    plan = PlanContract.model_validate(fixture)
    stripped_fixture = deepcopy(fixture)
    for door in stripped_fixture["doors"]:
        door.pop("doorOperationalMetadata", None)
    plan_without_metadata = PlanContract.model_validate(stripped_fixture)

    assert door_path_node_snapshot(plan) == door_path_node_snapshot(plan_without_metadata)

    assert [(room.id, room.x, room.y, room.widthFeet, room.lengthFeet) for room in plan.rooms] == [
        (room.id, room.x, room.y, room.widthFeet, room.lengthFeet)
        for room in plan_without_metadata.rooms
    ]
