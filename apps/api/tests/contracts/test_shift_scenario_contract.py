import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import (
    AssumptionsRegisterContract,
    DayProfileContract,
    PlanContract,
    ScenarioContract,
    TaskTemplateContract,
    validate_manual_assignment_contract,
    validate_shift_scenario_contract,
)

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"
INVALID_FIXTURES = FIXTURES / "invalid"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_invalid_fixture(name: str) -> dict:
    with (INVALID_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def test_shift_scenario_fixture_matches_python_contract_with_references() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))
    assignment_set = validate_manual_assignment_contract(
        load_fixture("manual-assignment-basic.json"), plan
    )
    assumptions = AssumptionsRegisterContract.model_validate(load_fixture("assumptions-basic.json"))
    task_templates = TaskTemplateContract.model_validate(load_fixture("task-templates-basic.json"))
    day_profile = DayProfileContract.model_validate(load_fixture("day-profile-typical.json"))
    scenario = validate_shift_scenario_contract(
        load_fixture("shift-scenario-basic.json"),
        plan=plan,
        assignment_set=assignment_set,
        assumptions=assumptions,
        task_templates=task_templates,
        day_profile=day_profile,
    )

    assert scenario.schemaVersion == "1.0.0"
    assert scenario.planId == plan.planId
    assert scenario.assignmentSetId == assignment_set.assignmentSetId
    assert len(scenario.roomLoads) == len(plan.rooms)


@pytest.mark.parametrize(
    "fixture_name",
    [
        "shift-scenario-missing-assumptions.json",
        "shift-scenario-bad-seed.json",
        "shift-scenario-bad-timestep.json",
    ],
)
def test_invalid_shift_scenario_fixtures_are_rejected(fixture_name: str) -> None:
    with pytest.raises((ValidationError, ValueError)):
        ScenarioContract.model_validate(load_invalid_fixture(fixture_name))


def test_shift_scenario_mismatched_plan_id_is_rejected_with_reference() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))

    with pytest.raises(ValueError):
        validate_shift_scenario_contract(
            load_invalid_fixture("shift-scenario-mismatched-plan-id.json"),
            plan=plan,
        )
