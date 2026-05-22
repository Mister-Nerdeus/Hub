import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import PlanContract

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"


def load_fixture(relative_path: str) -> dict:
    with (FIXTURES / relative_path).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def test_phase2_plan_has_source_alignment_fields() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))

    assert plan.description is not None
    assert plan.createdAt
    assert plan.updatedAt
    assert plan.rooms[0].roomType
    assert plan.rooms[0].maxPatients >= 1
    assert isinstance(plan.rooms[0].traumaCapable, bool)
    assert isinstance(plan.rooms[0].isolationCapable, bool)
    assert plan.rooms[0].doorPoint is not None
    assert plan.nurseStations[0].stationType == "primary"
    assert isinstance(plan.zones[0].travelBlocked, bool)
    assert plan.zones[0].travelPenalty is not None


@pytest.mark.parametrize(
    "fixture_name",
    [
        "invalid/plan-missing-room-capability.json",
        "invalid/plan-bad-station-type.json",
        "invalid/plan-bad-zone-travel-penalty.json",
    ],
)
def test_source_alignment_invalid_fixtures_fail(fixture_name: str) -> None:
    with pytest.raises(ValidationError):
        PlanContract.model_validate(load_fixture(fixture_name))
