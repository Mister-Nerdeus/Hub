import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import DayProfileContract

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"
INVALID_FIXTURES = FIXTURES / "invalid"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_invalid_fixture(name: str) -> dict:
    with (INVALID_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def test_typical_day_profile_matches_python_contract() -> None:
    day_profile = DayProfileContract.model_validate(load_fixture("day-profile-typical.json"))

    assert day_profile.schemaVersion == "1.0.0"
    assert day_profile.dayProfileId == "day-profile-typical"
    assert day_profile.segments[-1].endMinute == day_profile.shiftLengthMinutes


def test_slammed_day_profile_matches_python_contract() -> None:
    day_profile = DayProfileContract.model_validate(load_fixture("day-profile-slammed.json"))

    assert day_profile.schemaVersion == "1.0.0"
    assert day_profile.dayProfileId == "day-profile-slammed"
    assert day_profile.segments[1].taskVolumeMultiplier == 1.7


@pytest.mark.parametrize(
    "fixture_name",
    [
        "day-profile-bad-multiplier.json",
        "day-profile-overlapping-segments.json",
        "day-profile-bad-minute-range.json",
        "day-profile-gap-in-coverage.json",
    ],
)
def test_invalid_day_profile_fixtures_are_rejected(fixture_name: str) -> None:
    with pytest.raises((ValidationError, ValueError)):
        DayProfileContract.model_validate(load_invalid_fixture(fixture_name))
