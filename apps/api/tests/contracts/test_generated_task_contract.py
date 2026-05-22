import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import (
    PlanContract,
    TaskTemplateContract,
    validate_generated_operational_task_set,
    validate_shift_scenario_contract,
)

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"
TASK_FIXTURES = FIXTURES / "tasks"
INVALID_TASK_FIXTURES = TASK_FIXTURES / "invalid"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_task_fixture(name: str) -> dict:
    with (TASK_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_invalid_task_fixture(name: str) -> dict:
    with (INVALID_TASK_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def build_references() -> tuple[PlanContract, object, TaskTemplateContract]:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))
    task_templates = TaskTemplateContract.model_validate(load_fixture("task-templates-basic.json"))
    scenario = validate_shift_scenario_contract(
        load_fixture("shift-scenario-basic.json"),
        plan=plan,
        task_templates=task_templates,
    )
    return plan, scenario, task_templates


def test_generated_task_set_fixture_matches_python_contract() -> None:
    plan, scenario, task_templates = build_references()
    task_set = validate_generated_operational_task_set(
        load_task_fixture("generated-task-set-basic.json"),
        scenario=scenario,
        task_templates=task_templates,
        plan=plan,
    )

    assert task_set.generatedTaskSetId == "generated-task-set-basic"
    assert task_set.taskCount == len(task_set.generatedTasks)


@pytest.mark.parametrize(
    "fixture_name",
    [
        "generated-task-bad-minute.json",
        "generated-task-bad-duration.json",
        "generated-task-unknown-room.json",
        "generated-task-duplicate-id.json",
        "generated-task-set-mismatched-scenario.json",
    ],
)
def test_invalid_generated_task_fixtures_are_rejected(fixture_name: str) -> None:
    _, scenario, task_templates = build_references()

    with pytest.raises((ValidationError, ValueError)):
        validate_generated_operational_task_set(
            load_invalid_task_fixture(fixture_name),
            scenario=scenario,
            task_templates=task_templates,
        )


def test_generated_task_count_mismatch_is_rejected() -> None:
    _, scenario, _ = build_references()
    task_set = load_task_fixture("generated-task-set-basic.json")
    task_set["taskCount"] += 1

    with pytest.raises((ValidationError, ValueError)):
        validate_generated_operational_task_set(task_set, scenario=scenario)
