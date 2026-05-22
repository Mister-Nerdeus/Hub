import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import (
    PlanContract,
    Warning,
    validate_generated_operational_task_set,
    validate_manual_assignment_contract,
    validate_nurse_task_assignment_contract,
    validate_operational_report_contract,
    validate_shift_scenario_contract,
)

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"
REPORT_FIXTURES = FIXTURES / "reports"
TASK_FIXTURES = FIXTURES / "tasks"
INVALID_FIXTURES = FIXTURES / "invalid"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_report_fixture(name: str) -> dict:
    with (REPORT_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_task_fixture(name: str) -> dict:
    with (TASK_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_invalid_fixture(name: str) -> dict:
    with (INVALID_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def build_references():
    scenario = validate_shift_scenario_contract(load_fixture("shift-scenario-basic.json"))
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))
    assignment_set = validate_manual_assignment_contract(
        load_fixture("manual-assignment-basic.json"),
        plan,
    )
    generated_task_set = validate_generated_operational_task_set(
        load_task_fixture("generated-task-set-basic.json"),
        scenario=scenario,
    )
    assignment_result = load_task_fixture("nurse-task-assignments-basic.json")
    nurse_task_assignment_set = validate_nurse_task_assignment_contract(
        assignment_result["assignmentSet"],
        scenario=scenario,
        assignment_set=assignment_set,
        generated_task_set=generated_task_set,
    )
    warnings = [Warning.model_validate(warning) for warning in assignment_result["warnings"]]
    return (
        scenario,
        generated_task_set,
        nurse_task_assignment_set,
        assignment_set,
        warnings,
    )


def test_operational_report_fixture_matches_python_contract() -> None:
    (
        scenario,
        generated_task_set,
        nurse_task_assignment_set,
        assignment_set,
        warnings,
    ) = build_references()

    report = validate_operational_report_contract(
        load_report_fixture("operational-report-basic.json"),
        scenario=scenario,
        generated_task_set=generated_task_set,
        nurse_task_assignment_set=nurse_task_assignment_set,
        manual_assignment_set=assignment_set,
        warnings=warnings,
    )

    assert report.reportType == "operational_summary"
    assert report.summary.totalGeneratedTasks == generated_task_set.taskCount
    assert report.unassignedTaskSummary.taskIds == [
        "task-basic-hall-bed-01-turnover-001"
    ]


@pytest.mark.parametrize(
    "fixture_name",
    [
        "report-missing-summary.json",
        "report-clinical-safety-claim.json",
        "report-unknown-nurse.json",
        "report-unknown-task.json",
        "report-count-mismatch.json",
    ],
)
def test_invalid_operational_report_fixtures_are_rejected(fixture_name: str) -> None:
    (
        scenario,
        generated_task_set,
        nurse_task_assignment_set,
        assignment_set,
        warnings,
    ) = build_references()

    with pytest.raises((ValidationError, ValueError)):
        validate_operational_report_contract(
            load_invalid_fixture(fixture_name),
            scenario=scenario,
            generated_task_set=generated_task_set,
            nurse_task_assignment_set=nurse_task_assignment_set,
            manual_assignment_set=assignment_set,
            warnings=warnings,
        )
