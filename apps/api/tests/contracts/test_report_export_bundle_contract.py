import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import (
    validate_report_export_bundle_contract,
    validate_scenario_comparison_contract,
)

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"
COMPARISON_FIXTURES = FIXTURES / "comparison"
EXPORT_FIXTURES = FIXTURES / "export"
INVALID_FIXTURES = FIXTURES / "invalid"


def load_comparison_fixture(name: str) -> dict:
    with (COMPARISON_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_export_fixture(name: str) -> dict:
    with (EXPORT_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_invalid_fixture(name: str) -> dict:
    with (INVALID_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def test_scenario_comparison_fixture_matches_python_contract() -> None:
    bundle = validate_report_export_bundle_contract(
        load_export_fixture("report-export-bundle-basic.json")
    )
    comparison = validate_scenario_comparison_contract(
        load_comparison_fixture("scenario-comparison-basic.json"),
        reports=bundle.reports,
    )

    assert comparison.comparisonType == "manual_scenario_comparison"
    assert comparison.reportIds[0] == comparison.baselineReportId
    assert comparison.summary.maxGeneratedTasks == 8
    assert comparison.summary.maxBusiestMinuteTaskCount == 3


def test_report_export_bundle_fixture_matches_python_contract() -> None:
    bundle = validate_report_export_bundle_contract(
        load_export_fixture("report-export-bundle-basic.json")
    )

    assert bundle.exportType == "operational_report_bundle"
    assert len(bundle.reports) == 2
    assert bundle.comparison is not None
    assert bundle.metadata.source == "synthetic-operational-data"


def test_report_export_bundle_accepts_omitted_optional_comparison() -> None:
    fixture = load_export_fixture("report-export-bundle-basic.json")
    fixture.pop("comparison")

    bundle = validate_report_export_bundle_contract(fixture)

    assert bundle.comparison is None


def test_report_export_bundle_accepts_null_optional_comparison() -> None:
    fixture = load_export_fixture("report-export-bundle-basic.json")
    fixture["comparison"] = None

    bundle = validate_report_export_bundle_contract(fixture)

    assert bundle.comparison is None


@pytest.mark.parametrize(
    "fixture_name",
    [
        "export-bundle-missing-report.json",
        "export-bundle-comparison-mismatch.json",
        "export-bundle-safety-claim.json",
    ],
)
def test_invalid_report_export_bundle_fixtures_are_rejected(fixture_name: str) -> None:
    with pytest.raises((ValidationError, ValueError)):
        validate_report_export_bundle_contract(load_invalid_fixture(fixture_name))


def test_report_export_bundle_rejects_recommendation_language() -> None:
    bundle = load_export_fixture("report-export-bundle-basic.json")
    bundle["comparison"]["label"] = "Recommended scenario comparison"

    with pytest.raises((ValidationError, ValueError)):
        validate_report_export_bundle_contract(bundle)
