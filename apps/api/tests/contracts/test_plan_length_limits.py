import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import PlanContract

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"


def load_fixture(relative_path: str) -> dict:
    with (FIXTURES / relative_path).open(encoding="utf-8") as fixture:
        return json.load(fixture)


@pytest.mark.parametrize(
    "fixture_name",
    [
        "invalid/plan-id-too-long.json",
        "invalid/plan-name-too-long.json",
    ],
)
def test_plan_length_limit_fixtures_fail(fixture_name: str) -> None:
    with pytest.raises(ValidationError):
        PlanContract.model_validate(load_fixture(fixture_name))
