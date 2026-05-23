import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import validate_bundle_audit_trail_contract

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"
EXPORT_FIXTURES = FIXTURES / "export"
INVALID_FIXTURES = FIXTURES / "invalid"


def load_export_fixture(name: str) -> dict:
    with (EXPORT_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_invalid_fixture(name: str) -> dict:
    with (INVALID_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def test_valid_bundle_audit_trail_fixture_matches_python_contract() -> None:
    audit_trail = validate_bundle_audit_trail_contract(
        load_export_fixture("bundle-audit-trail-basic.json")
    )

    assert audit_trail.validationStatus == "passed"
    assert audit_trail.exportId == audit_trail.integrity.exportId
    assert len(audit_trail.reviewSteps) == 4


@pytest.mark.parametrize(
    "fixture_name",
    [
        "bundle-audit-trail-missing-step.json",
        "bundle-audit-trail-security-claim.json",
        "bundle-audit-trail-mismatched-export-id.json",
    ],
)
def test_invalid_bundle_audit_trail_fixtures_are_rejected(fixture_name: str) -> None:
    with pytest.raises((ValidationError, ValueError)):
        validate_bundle_audit_trail_contract(load_invalid_fixture(fixture_name))


def test_validation_status_mismatch_is_rejected() -> None:
    audit_trail = load_export_fixture("bundle-audit-trail-basic.json")
    audit_trail["validationStatus"] = "failed"

    with pytest.raises((ValidationError, ValueError)):
        validate_bundle_audit_trail_contract(audit_trail)


def test_reviewer_identity_fields_are_rejected() -> None:
    audit_trail = load_export_fixture("bundle-audit-trail-basic.json")
    audit_trail["reviewerId"] = "local-reviewer"

    with pytest.raises((ValidationError, ValueError)):
        validate_bundle_audit_trail_contract(audit_trail)
