import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import PlanContract, validate_manual_assignment_contract

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"
INVALID_FIXTURES = FIXTURES / "invalid"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_invalid_fixture(name: str) -> dict:
    with (INVALID_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def test_manual_assignment_basic_validates() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))
    assignment_set = validate_manual_assignment_contract(
        load_fixture("manual-assignment-basic.json"), plan
    )

    assert assignment_set.assignmentSetId == "manual-assignment-basic"
    assert assignment_set.nurses[0].breakWindows[0].nurseId == assignment_set.nurses[0].id


@pytest.mark.parametrize(
    "fixture_name",
    [
        "manual-assignment-duplicate-nurse-id.json",
        "manual-assignment-room-assigned-twice.json",
        "manual-assignment-unknown-room.json",
        "manual-assignment-unknown-nurse.json",
        "manual-assignment-break-window-invalid.json",
    ],
)
def test_invalid_manual_assignment_fixtures_are_rejected(fixture_name: str) -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))

    with pytest.raises((ValidationError, ValueError)):
        validate_manual_assignment_contract(load_invalid_fixture(fixture_name), plan)
