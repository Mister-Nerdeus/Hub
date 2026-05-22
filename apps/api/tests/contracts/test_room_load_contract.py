import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import PlanContract, validate_room_loads

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"
INVALID_FIXTURES = FIXTURES / "invalid"


def load_fixture(name: str):
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_invalid_fixture(name: str):
    with (INVALID_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def test_room_loads_basic_validates_with_plan_rooms() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))
    room_loads = validate_room_loads(load_fixture("room-loads-basic.json"), plan)

    assert room_loads[0].acuity == 3
    assert room_loads[1].medicationFrequency == "high"


@pytest.mark.parametrize(
    "fixture_name",
    [
        "room-load-bad-frequency.json",
        "room-load-bad-burden.json",
        "room-load-unknown-room.json",
    ],
)
def test_invalid_room_load_fixtures_are_rejected(fixture_name: str) -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))

    with pytest.raises((ValidationError, ValueError)):
        validate_room_loads(load_invalid_fixture(fixture_name), plan)


def test_old_numeric_room_load_fields_are_rejected() -> None:
    with pytest.raises((ValidationError, ValueError)):
        validate_room_loads(
            [
                {
                    "roomId": "room-01",
                    "occupied": True,
                    "acuityScore": 3,
                    "traumaActive": False,
                    "isolationActive": False,
                    "behavioralRisk": False,
                    "fallRisk": False,
                    "sitterRequired": False,
                    "medicationFrequency": 2,
                    "monitoringFrequency": 2,
                    "procedureBurden": 1,
                    "turnoverBurden": 1,
                }
            ]
        )
