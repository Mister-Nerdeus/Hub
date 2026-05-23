import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import validate_plan_builder_defaults_contract

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"
INVALID_FIXTURES = FIXTURES / "invalid"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_invalid_fixture(name: str) -> dict:
    with (INVALID_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def test_basic_plan_builder_defaults_validate() -> None:
    defaults = validate_plan_builder_defaults_contract(
        load_fixture("plan-builder-defaults-basic.json")
    )

    assert defaults.defaultsId == "plan-builder-defaults-basic"
    assert defaults.planSetup.planName == "Generated ER Pod"
    assert defaults.roomDefaults.roomsPerRow <= defaults.roomDefaults.roomCount


@pytest.mark.parametrize(
    "fixture_name",
    [
        "plan-builder-defaults-bad-room-count.json",
        "plan-builder-defaults-bad-room-size.json",
        "plan-builder-defaults-bad-door-width.json",
        "plan-builder-defaults-bad-hallway-width.json",
        "plan-builder-defaults-bad-station-count.json",
        "plan-builder-defaults-bad-path-graph-config.json",
        "plan-builder-defaults-bad-zone-penalty.json",
        "plan-builder-defaults-empty-labels.json",
    ],
)
def test_invalid_plan_builder_defaults_are_rejected(fixture_name: str) -> None:
    with pytest.raises((ValidationError, ValueError)):
        validate_plan_builder_defaults_contract(load_invalid_fixture(fixture_name))
