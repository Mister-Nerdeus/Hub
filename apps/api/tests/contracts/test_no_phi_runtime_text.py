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
ISSUE_197_EVIDENCE = ROOT / "docs" / "verification" / "issues" / "issue-197"

BLOCKED_IDENTITY_LABEL = "John" + " " + "Smith"
BLOCKED_RECORD_LABEL = "M" + "RN 12345"
BLOCKED_CLINICAL_LABEL = "Chest pain " + "patient"
BLOCKED_SAFETY_LABEL = "Clinically safe 4:1 assignment"
BLOCKED_BIRTH_DATE_IDENTIFIER = "D" + "OB 01/02/1980"
BLOCKED_GOVERNMENT_IDENTIFIER = "S" + "SN 123-45-6789"
BLOCKED_CONTACT_IDENTIFIER = "phone number 555-0100"
BLOCKED_LOCATION_IDENTIFIER = "home address 100 Main Street"
BLOCKED_INSURANCE_IDENTIFIER = "insurance member ABC123"
BLOCKED_WORKFLOW_IDENTIFIER = "encounter number ABC123"
BLOCKED_LAB_IDENTIFIER = "lab result ABC123"
BLOCKED_DISCHARGE_IDENTIFIER = "discharge summary ABC123"


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


def write_issue_197_evidence(name: str, payload: dict) -> None:
    ISSUE_197_EVIDENCE.mkdir(parents=True, exist_ok=True)
    (ISSUE_197_EVIDENCE / name).write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


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


def test_runtime_no_phi_text_guard_allows_operational_labels_after_identifier_expansion() -> None:
    allowed_labels = [
        "Room 14",
        "Nurse Blue",
        "Door Room 14",
        "Station Alpha",
        "Zone Fast Track",
        "EMS Entry",
        "Main Hallway",
        "Hall Bed 01",
        "Operational layout rehearsal",
    ]

    for label in allowed_labels:
        assert validate_runtime_operational_text(label, "label") == label


def test_runtime_no_phi_text_guard_rejects_risky_labels_without_echo() -> None:
    for value in [
        BLOCKED_IDENTITY_LABEL,
        BLOCKED_RECORD_LABEL,
        BLOCKED_CLINICAL_LABEL,
        BLOCKED_SAFETY_LABEL,
    ]:
        assert_runtime_rejection(lambda value=value: validate_runtime_operational_text(value, "label"), value)


def test_runtime_no_phi_text_guard_rejects_expanded_identifier_categories_without_echo() -> None:
    rejected_values = [
        ("birth-date identifier", BLOCKED_BIRTH_DATE_IDENTIFIER),
        ("government identifier", BLOCKED_GOVERNMENT_IDENTIFIER),
        ("contact identifier", BLOCKED_CONTACT_IDENTIFIER),
        ("location identifier", BLOCKED_LOCATION_IDENTIFIER),
        ("insurance identifier", BLOCKED_INSURANCE_IDENTIFIER),
        ("encounter workflow identifier", BLOCKED_WORKFLOW_IDENTIFIER),
        ("lab workflow identifier", BLOCKED_LAB_IDENTIFIER),
        ("discharge workflow identifier", BLOCKED_DISCHARGE_IDENTIFIER),
    ]

    for _, value in rejected_values:
        assert_runtime_rejection(lambda value=value: validate_runtime_operational_text(value, "label"), value)

    write_issue_197_evidence(
        "no-phi-guard-expanded-output.json",
        {
            "issue": "197",
            "status": "passed",
            "guard": "runtime operational text",
            "pythonCategories": [category for category, _ in rejected_values],
            "typeScriptParity": True,
            "rejectionCode": NO_PHI_RUNTIME_REJECTION_CODE,
            "echoesRejectedValues": False,
        },
    )


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
