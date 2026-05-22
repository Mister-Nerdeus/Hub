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
    Warning,
    validate_generated_operational_task_set,
    validate_manual_assignment_contract,
    validate_nurse_task_assignment_contract,
    validate_operational_report_contract,
    validate_room_loads,
    validate_shift_scenario_contract,
)

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"
INVALID_FIXTURES = FIXTURES / "invalid"
TASK_FIXTURES = FIXTURES / "tasks"
INVALID_TASK_FIXTURES = TASK_FIXTURES / "invalid"
REPORT_FIXTURES = FIXTURES / "reports"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_invalid_fixture(name: str) -> dict:
    with (INVALID_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_task_fixture(name: str) -> dict:
    with (TASK_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_report_fixture(name: str) -> dict:
    with (REPORT_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_invalid_task_fixture(name: str) -> dict:
    with (INVALID_TASK_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def test_plan_fixture_matches_python_contract() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-basic.json"))

    assert plan.schemaVersion == "1.0.0"
    assert plan.scale.origin == "top-left"
    assert plan.scale.unit == "feet"


def test_phase2_plan_fixture_matches_python_contract() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))

    assert len(plan.rooms) == 7
    assert len(plan.nurseStations) == 1
    assert plan.scale.snapToGrid is True


def test_scenario_fixture_matches_python_contract() -> None:
    scenario = ScenarioContract.model_validate(load_fixture("scenario-basic.json"))

    assert scenario.schemaVersion == "1.0.0"
    assert scenario.shiftLengthMinutes == 720
    assert scenario.timestepMinutes == 15
    assert scenario.assumptionsId == "assumptions-basic"
    assert scenario.roomLoads[0].acuity == 3
    assert scenario.roomLoads[0].monitoringFrequency == "high"


def test_room_load_fixture_matches_python_contract() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))
    room_loads = validate_room_loads(load_fixture("room-loads-basic.json"), plan)

    assert len(room_loads) == 7
    assert room_loads[1].expectedTurnover == "high"


def test_manual_assignment_fixture_matches_python_contract() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))
    assignment_set = validate_manual_assignment_contract(
        load_fixture("manual-assignment-basic.json"), plan
    )

    assert assignment_set.schemaVersion == "1.0.0"
    assert len(assignment_set.nurses) == 3


def test_phase4_fixture_set_matches_python_contracts() -> None:
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

    assert scenario.scenarioId == "shift-scenario-basic"
    assert len(scenario.roomLoads) == len(plan.rooms)


def test_phase5_generated_task_set_fixture_matches_python_contract() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))
    task_templates = TaskTemplateContract.model_validate(load_fixture("task-templates-basic.json"))
    scenario = validate_shift_scenario_contract(
        load_fixture("shift-scenario-basic.json"),
        plan=plan,
        task_templates=task_templates,
    )
    task_set = validate_generated_operational_task_set(
        load_task_fixture("generated-task-set-basic.json"),
        scenario=scenario,
        task_templates=task_templates,
        plan=plan,
    )

    assert task_set.generatedTaskSetId == "generated-task-set-basic"
    assert task_set.taskCount == len(task_set.generatedTasks)


def test_phase5_nurse_task_assignment_fixture_matches_python_contract() -> None:
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))
    assignment_set = validate_manual_assignment_contract(
        load_fixture("manual-assignment-basic.json"),
        plan,
    )
    task_set = validate_generated_operational_task_set(
        load_task_fixture("generated-task-set-basic.json")
    )
    nurse_task_assignment = validate_nurse_task_assignment_contract(
        load_fixture("nurse-task-assignment-basic.json"),
        assignment_set=assignment_set,
        generated_task_set=task_set,
    )

    assert len(nurse_task_assignment.taskAssignments) == task_set.taskCount


def test_phase6_operational_report_fixture_matches_python_contract() -> None:
    scenario = validate_shift_scenario_contract(load_fixture("shift-scenario-basic.json"))
    plan = PlanContract.model_validate(load_fixture("plan-er-pod-phase2.json"))
    assignment_set = validate_manual_assignment_contract(
        load_fixture("manual-assignment-basic.json"),
        plan,
    )
    task_set = validate_generated_operational_task_set(
        load_task_fixture("generated-task-set-basic.json"),
        scenario=scenario,
    )
    assignment_result = load_task_fixture("nurse-task-assignments-basic.json")
    nurse_task_assignment = validate_nurse_task_assignment_contract(
        assignment_result["assignmentSet"],
        scenario=scenario,
        assignment_set=assignment_set,
        generated_task_set=task_set,
    )
    report = validate_operational_report_contract(
        load_report_fixture("operational-report-basic.json"),
        scenario=scenario,
        generated_task_set=task_set,
        nurse_task_assignment_set=nurse_task_assignment,
        manual_assignment_set=assignment_set,
        warnings=[Warning.model_validate(warning) for warning in assignment_result["warnings"]],
    )

    assert report.summary.totalGeneratedTasks == task_set.taskCount


@pytest.mark.parametrize(
    "fixture_name",
    [
        "plan-duplicate-door-id.json",
        "plan-duplicate-path-edge-id.json",
        "plan-bad-room-type.json",
        "plan-path-edge-missing-node.json",
        "plan-extra-unknown-field.json",
        "plan-missing-hallways.json",
        "plan-missing-room-capability.json",
        "plan-bad-station-type.json",
        "plan-bad-zone-travel-penalty.json",
        "plan-id-too-long.json",
        "plan-name-too-long.json",
        "plan-door-path-node-wrong-type.json",
        "plan-station-path-node-wrong-type.json",
        "plan-room-path-node-unrelated-door.json",
        "plan-path-node-linked-object-mismatch.json",
    ],
)
def test_invalid_plan_fixtures_are_rejected_by_python_contract(fixture_name: str) -> None:
    with pytest.raises((ValidationError, ValueError)):
        PlanContract.model_validate(load_invalid_fixture(fixture_name))
