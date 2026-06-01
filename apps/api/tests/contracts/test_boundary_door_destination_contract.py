import copy
import json
from pathlib import Path

import pytest

from app.contracts import PlanContract


ROOT = Path(__file__).resolve().parents[4]
FIXTURE_DIR = ROOT / "packages" / "shared" / "fixtures"


def load_fixture(name: str) -> dict:
    return json.loads((FIXTURE_DIR / name).read_text(encoding="utf-8"))


def boundary_destination_plan() -> dict:
    plan = copy.deepcopy(load_fixture("plan-basic.json"))
    plan["supportAccessPoints"] = [
        {
            "objectType": "support_access",
            "id": "support-access-zone-a",
            "label": "Zone A access",
            "ownerKind": "zone",
            "ownerId": "zone-a",
            "wall": "north",
            "offsetFeet": 2,
            "widthFeet": 4,
        }
    ]
    plan["perimeterWalls"] = [
        {
            "perimeterWallId": "plan-basic-perimeter-wall",
            "label": "ER pod boundary",
            "segments": [
                {
                    "segmentId": "plan-basic-perimeter-wall-north",
                    "label": "North boundary",
                    "xFeet": 0,
                    "yFeet": 0,
                    "widthFeet": 28,
                    "heightFeet": 0.5,
                    "orientation": "horizontal",
                    "blocksTravel": True,
                    "locked": True,
                }
            ],
        }
    ]
    plan["entryExits"] = [
        {
            "entryExitId": "main-entry",
            "label": "Main entry",
            "kind": "main_entry",
            "xFeet": 0,
            "yFeet": 0,
            "widthFeet": 4,
            "heightFeet": 2,
            "connectsFromId": "hallway-main",
            "connectsTo": {
                "destinationKind": "hallway",
                "destinationId": "hallway-main",
                "displayLabel": "Main Hallway",
            },
            "blocksTravel": False,
        }
    ]
    plan["doorDestinations"] = [
        {
            "doorId": "door-room-01",
            "ownerKind": "room",
            "ownerId": "room-01",
            "leadsToKind": "hallway",
            "leadsToId": "hallway-main",
            "leadsToLabel": "Main Hallway",
            "travelRole": "patient_flow",
        },
        {
            "doorId": "support-access-zone-a",
            "ownerKind": "zone",
            "ownerId": "zone-a",
            "leadsToKind": "zone",
            "leadsToId": "zone-a",
            "leadsToLabel": "Zone A",
            "travelRole": "supply_flow",
        },
    ]
    plan["splitRooms"] = [
        {
            "splitRoomId": "split-room-01",
            "parentRoomId": "room-01",
            "splitMode": "two_bed",
            "dividerOrientation": "vertical",
            "dividerRatio": 0.5,
            "bedPositions": [
                {
                    "bedPositionId": "room-01:bed-a",
                    "parentRoomId": "room-01",
                    "label": "Room 01 A",
                    "assignmentTarget": True,
                    "relativeBounds": {
                        "xRatio": 0,
                        "yRatio": 0,
                        "widthRatio": 0.5,
                        "heightRatio": 1,
                    },
                },
                {
                    "bedPositionId": "room-01:bed-b",
                    "parentRoomId": "room-01",
                    "label": "Room 01 B",
                    "assignmentTarget": True,
                    "relativeBounds": {
                        "xRatio": 0.5,
                        "yRatio": 0,
                        "widthRatio": 0.5,
                        "heightRatio": 1,
                    },
                },
            ],
        }
    ]
    plan["splitBays"] = []
    return plan


def test_plan_contract_accepts_boundary_door_destination_fields() -> None:
    plan = PlanContract.model_validate(boundary_destination_plan())

    assert plan.perimeterWalls[0].perimeterWallId == "plan-basic-perimeter-wall"
    assert plan.entryExits[0].connectsTo.displayLabel == "Main Hallway"
    assert plan.doorDestinations[1].doorId == "support-access-zone-a"
    assert plan.splitRooms[0].bedPositions[0].assignmentTarget is True


def test_plan_contract_rejects_deleted_door_destination_target() -> None:
    plan = boundary_destination_plan()
    plan["doorDestinations"][0]["leadsToId"] = "missing-hallway"

    with pytest.raises(ValueError, match="unknown hallway"):
        PlanContract.model_validate(plan)

