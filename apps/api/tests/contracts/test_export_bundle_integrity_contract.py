import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import (
    validate_export_bundle_integrity_contract,
    validate_report_export_bundle_contract,
)

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


def test_valid_integrity_fixture_matches_python_contract() -> None:
    bundle = validate_report_export_bundle_contract(
        load_export_fixture("report-export-bundle-basic.json")
    )
    integrity = validate_export_bundle_integrity_contract(
        load_export_fixture("report-export-bundle-integrity-basic.json"),
        bundle=bundle,
    )

    assert integrity.algorithm == "sha256"
    assert integrity.exportId == bundle.exportId


@pytest.mark.parametrize(
    "fixture_name",
    [
        "export-bundle-integrity-bad-hash.json",
        "export-bundle-integrity-mismatched-export-id.json",
    ],
)
def test_invalid_integrity_fixtures_fail_with_bundle_context(fixture_name: str) -> None:
    bundle = validate_report_export_bundle_contract(
        load_export_fixture("report-export-bundle-basic.json")
    )

    with pytest.raises((ValidationError, ValueError)):
        validate_export_bundle_integrity_contract(
            load_invalid_fixture(fixture_name),
            bundle=bundle,
        )


def test_tamper_proof_claim_is_rejected() -> None:
    integrity = load_export_fixture("report-export-bundle-integrity-basic.json")
    integrity["limitations"] = [
        *integrity["limitations"],
        "This integrity proof is tamper-proof.",
    ]

    with pytest.raises((ValidationError, ValueError)):
        validate_export_bundle_integrity_contract(integrity)
