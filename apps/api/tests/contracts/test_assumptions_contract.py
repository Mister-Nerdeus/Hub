import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import AssumptionsRegisterContract

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"
INVALID_FIXTURES = FIXTURES / "invalid"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_invalid_fixture(name: str) -> dict:
    with (INVALID_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def test_assumptions_fixture_matches_python_contract() -> None:
    assumptions = AssumptionsRegisterContract.model_validate(load_fixture("assumptions-basic.json"))

    assert assumptions.schemaVersion == "1.0.0"
    assert assumptions.assumptionsId == "assumptions-basic"
    assert assumptions.roomWorkloadWeights.acuity["5"] == 10
    assert assumptions.nurseBurdenWeights.activeTaskMinutesPlaceholder == 0
    assert assumptions.simulationDefaults.defaultShiftLengthMinutes == 720


@pytest.mark.parametrize(
    "fixture_name",
    [
        "assumptions-missing-room-workload-weight.json",
        "assumptions-bad-duration.json",
        "assumptions-bad-frequency-mapping.json",
        "assumptions-negative-placeholder.json",
    ],
)
def test_invalid_assumptions_fixtures_are_rejected(fixture_name: str) -> None:
    with pytest.raises((ValidationError, ValueError)):
        AssumptionsRegisterContract.model_validate(load_invalid_fixture(fixture_name))
