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


def test_phase2_plan_contract_accepts_valid_layout() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))

    assert plan.planId == "plan-er-pod-phase2"
    assert plan.rooms[0].widthFeet > 0
    assert plan.hallways[0].widthFeet > 0
    assert plan.pathEdges[0].lengthFeet > 0


@pytest.mark.parametrize(
    "fixture_name",
    [
        "invalid/plan-duplicate-door-id.json",
        "invalid/plan-duplicate-path-edge-id.json",
        "invalid/plan-bad-room-type.json",
        "invalid/plan-path-edge-missing-node.json",
        "invalid/plan-extra-unknown-field.json",
        "invalid/plan-missing-hallways.json",
        "invalid/plan-missing-room-capability.json",
        "invalid/plan-bad-station-type.json",
        "invalid/plan-bad-zone-travel-penalty.json",
        "invalid/plan-id-too-long.json",
        "invalid/plan-name-too-long.json",
    ],
)
def test_phase2_plan_contract_rejects_invalid_layouts(fixture_name: str) -> None:
    with pytest.raises((ValidationError, ValueError)):
        PlanContract.model_validate(load_fixture(fixture_name))
