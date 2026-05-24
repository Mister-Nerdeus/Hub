import json
from copy import deepcopy
from pathlib import Path

import pytest

from app.contracts import (
    NO_PHI_RUNTIME_REJECTION_CODE,
    PlanContract,
    validate_manual_assignment_contract,
    validate_operational_report_contract,
    validate_runtime_operational_text,
    validate_shift_scenario_contract,
)

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"
REPORT_FIXTURES = FIXTURES / "reports"

BLOCKED_IDENTITY_LABEL = "John" + " " + "Smith"
BLOCKED_RECORD_LABEL = "M" + "RN 12345"
BLOCKED_CLINICAL_LABEL = "Chest pain " + "patient"
BLOCKED_SAFETY_LABEL = "Clinically safe 4:1 assignment"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_report_fixture(name: str) -> dict:
    with (REPORT_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def assert_runtime_rejection(action, rejected_value: str) -> None:
    with pytest.raises(ValueError) as exc_info:
        action()
    message = str(exc_info.value)
    assert NO_PHI_RUNTIME_REJECTION_CODE in message
    assert rejected_value not in message


def test_runtime_no_phi_text_guard_allows_operational_labels() -> None:
    for label in [
        "Room 14",
        "Nurse Blue",
        "Door Room 14",
        "Station Alpha",
        "Zone Fast Track",
        "Operational layout rehearsal",
    ]:
        assert validate_runtime_operational_text(label, "label") == label


def test_runtime_no_phi_text_guard_rejects_risky_labels_without_echo() -> None:
    for value in [
        BLOCKED_IDENTITY_LABEL,
        BLOCKED_RECORD_LABEL,
        BLOCKED_CLINICAL_LABEL,
        BLOCKED_SAFETY_LABEL,
    ]:
        assert_runtime_rejection(lambda value=value: validate_runtime_operational_text(value, "label"), value)


def test_runtime_no_phi_text_guard_is_enforced_by_python_contracts() -> None:
    plan = load_fixture("plan-basic.json")
    bad_room_label = deepcopy(plan)
    bad_room_label["rooms"][0]["label"] = BLOCKED_IDENTITY_LABEL
    assert_runtime_rejection(lambda: PlanContract.model_validate(bad_room_label), BLOCKED_IDENTITY_LABEL)

    bad_description = deepcopy(plan)
    bad_description["description"] = BLOCKED_RECORD_LABEL
    assert_runtime_rejection(lambda: PlanContract.model_validate(bad_description), BLOCKED_RECORD_LABEL)

    scenario = load_fixture("shift-scenario-basic.json")
    scenario["name"] = BLOCKED_CLINICAL_LABEL
    assert_runtime_rejection(lambda: validate_shift_scenario_contract(scenario), BLOCKED_CLINICAL_LABEL)

    assignment = load_fixture("manual-assignment-basic.json")
    assignment["nurses"][0]["name"] = BLOCKED_IDENTITY_LABEL
    assert_runtime_rejection(
        lambda: validate_manual_assignment_contract(assignment),
        BLOCKED_IDENTITY_LABEL,
    )

    report = load_report_fixture("operational-report-basic.json")
    report["title"] = BLOCKED_SAFETY_LABEL
    assert_runtime_rejection(lambda: validate_operational_report_contract(report), BLOCKED_SAFETY_LABEL)

    assert PlanContract.model_validate(load_fixture("plan-basic.json"))
    assert validate_shift_scenario_contract(load_fixture("shift-scenario-basic.json"))
    assert validate_manual_assignment_contract(load_fixture("manual-assignment-basic.json"))
    assert validate_operational_report_contract(load_report_fixture("operational-report-basic.json"))
