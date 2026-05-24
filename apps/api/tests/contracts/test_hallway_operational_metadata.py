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


def test_hallway_operational_metadata_validates_in_er_pod_fixture() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))

    assert [hallway.hallwayOperationalMetadata.hallwayClass for hallway in plan.hallways] == [
        "main",
        "ems",
    ]
    assert plan.hallways[0].hallwayOperationalMetadata.allowsBedMovement is True
    assert plan.hallways[1].hallwayOperationalMetadata.allowsPublicTraffic is False


def test_hallway_operational_metadata_rejects_invalid_enum_and_free_text_field() -> None:
    invalid_class = load_fixture("plan-er-pod-phase2.json")
    invalid_class["hallways"][0]["hallwayOperationalMetadata"]["hallwayClass"] = "public"
    with pytest.raises(ValidationError):
        PlanContract.model_validate(invalid_class)

    rejected_value = "Narrative hallway metadata"
    free_text = load_fixture("plan-er-pod-phase2.json")
    free_text["hallways"][0]["hallwayOperationalMetadata"]["freeText"] = rejected_value
    with pytest.raises(ValidationError) as exc_info:
        PlanContract.model_validate(free_text)
    assert rejected_value not in str(exc_info.value)


def test_hallway_width_geometry_remains_positive_and_feet_based() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))

    assert plan.hallways[0].widthFeet == 10
    assert plan.hallways[1].widthFeet == 8
    assert len(plan.hallways[0].points) == 2
