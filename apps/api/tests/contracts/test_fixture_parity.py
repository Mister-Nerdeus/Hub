import json
from pathlib import Path

from app.contracts import PlanContract, ScenarioContract

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def test_plan_fixture_matches_python_contract() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-basic.json"))

    assert plan.schemaVersion == "1.0.0"
    assert plan.units.origin == "top-left"
    assert plan.units.unit == "feet"


def test_scenario_fixture_matches_python_contract() -> None:
    scenario = ScenarioContract.model_validate(load_fixture("scenario-basic.json"))

    assert scenario.schemaVersion == "1.0.0"
    assert scenario.shiftLengthMinutes == 480
    assert scenario.timestepMinutes == 5
