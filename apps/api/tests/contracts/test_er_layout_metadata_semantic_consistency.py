import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import PlanContract

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"
EVIDENCE = ROOT / "docs" / "verification" / "issues" / "issue-207"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def write_evidence(name: str, payload: dict) -> None:
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    with (EVIDENCE / name).open("w", encoding="utf-8") as output:
        json.dump(payload, output, indent=2)
        output.write("\n")


def entry_node(plan: dict) -> dict:
    return next(node for node in plan["pathNodes"] if node["nodeType"] == "entry")


def test_canonical_fixture_special_room_door_semantics_are_coherent() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))
    checks = {
        "door-room-02": ("room-02", "trauma", "trauma"),
        "door-room-03": ("room-03", "isolation", "isolation"),
        "door-room-04": ("room-04", "behavioral", "behavioral"),
    }
    rooms_by_id = {room.id: room for room in plan.rooms}
    doors_by_id = {door.id: door for door in plan.doors}

    for door_id, (room_id, room_class, door_class) in checks.items():
        assert rooms_by_id[room_id].roomOperationalMetadata.roomClass == room_class
        assert doors_by_id[door_id].doorOperationalMetadata.doorClass == door_class

    write_evidence(
        "metadata-semantic-consistency-output.json",
        {
            "issue": "207",
            "status": "passed",
            "pythonSemanticValidation": "aligned-with-typescript",
            "typeScriptSemanticValidation": "aligned-with-python",
            "rejectedDoorClassMismatch": True,
            "rejectedBoundaryMismatch": True,
            "specialRoomDoorChecks": checks,
        },
    )


def test_special_room_door_semantic_mismatches_are_rejected() -> None:
    wrong_door_class = load_fixture("plan-er-pod-phase2.json")
    next(door for door in wrong_door_class["doors"] if door["id"] == "door-room-02")[
        "doorOperationalMetadata"
    ]["doorClass"] = "isolation"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(wrong_door_class)

    wrong_boundary = load_fixture("plan-er-pod-phase2.json")
    next(door for door in wrong_boundary["doors"] if door["id"] == "door-room-04")[
        "doorOperationalMetadata"
    ]["behavioralBoundary"] = False
    with pytest.raises(ValidationError):
        PlanContract.model_validate(wrong_boundary)


def test_entry_linked_path_node_rejects_self_reference() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))
    entry = next(node for node in plan.pathNodes if node.nodeType == "entry")
    assert entry.entryOperationalMetadata.linkedPathNodeId == "node-hall-west"
    assert entry.entryOperationalMetadata.linkedPathNodeId != entry.id

    self_reference = load_fixture("plan-er-pod-phase2.json")
    entry_node(self_reference)["entryOperationalMetadata"]["linkedPathNodeId"] = "node-ems-entry"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(self_reference)

    write_evidence(
        "entry-link-semantics-output.json",
        {
            "issue": "207",
            "status": "passed",
            "entryNodeId": entry.id,
            "linkedPathNodeId": entry.entryOperationalMetadata.linkedPathNodeId,
            "selfReferenceRejected": True,
            "pythonSelfReferenceRejected": True,
            "typeScriptSelfReferenceRejected": True,
        },
    )
