import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import (
    PlanContract,
    validate_generated_operational_task_set,
    validate_manual_assignment_contract,
    validate_nurse_task_assignment_contract,
)

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"
TASK_FIXTURES = FIXTURES / "tasks"
INVALID_FIXTURES = FIXTURES / "invalid"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_task_fixture(name: str) -> dict:
    with (TASK_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_invalid_fixture(name: str) -> dict:
    with (INVALID_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def build_references():
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))
    assignment_set = validate_manual_assignment_contract(
        load_fixture("manual-assignment-basic.json"),
        plan,
    )
    generated_task_set = validate_generated_operational_task_set(
        load_task_fixture("generated-task-set-basic.json")
    )
    return assignment_set, generated_task_set


def test_nurse_task_assignment_fixture_matches_python_contract() -> None:
    assignment_set, generated_task_set = build_references()
    nurse_task_assignment = validate_nurse_task_assignment_contract(
        load_fixture("nurse-task-assignment-basic.json"),
        assignment_set=assignment_set,
        generated_task_set=generated_task_set,
    )

    assert nurse_task_assignment.nurseTaskAssignmentSetId == (
        "nurse-task-assignment-generated-task-set-basic"
    )
    assert len(nurse_task_assignment.taskAssignments) == len(
        generated_task_set.generatedTasks
    )


@pytest.mark.parametrize(
    "fixture_name",
    [
        "nurse-task-assignment-unknown-nurse.json",
        "nurse-task-assignment-unknown-task.json",
        "nurse-task-assignment-task-assigned-twice.json",
        "nurse-task-assignment-minute-mismatch.json",
    ],
)
def test_invalid_nurse_task_assignment_fixtures_are_rejected(fixture_name: str) -> None:
    assignment_set, generated_task_set = build_references()

    with pytest.raises((ValidationError, ValueError)):
        validate_nurse_task_assignment_contract(
            load_invalid_fixture(fixture_name),
            assignment_set=assignment_set,
            generated_task_set=generated_task_set,
        )


def test_unassigned_task_with_nurse_id_is_rejected() -> None:
    assignment_set, generated_task_set = build_references()
    assignment = load_fixture("nurse-task-assignment-basic.json")
    assignment["taskAssignments"][2]["nurseId"] = "nurse-alpha"

    with pytest.raises((ValidationError, ValueError)):
        validate_nurse_task_assignment_contract(
            assignment,
            assignment_set=assignment_set,
            generated_task_set=generated_task_set,
        )
