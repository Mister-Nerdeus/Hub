import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import PlanContract

ROOT = Path(__file__).resolve().parents[4]
INVALID_FIXTURES = ROOT / "packages" / "shared" / "fixtures" / "invalid"


def load_invalid_fixture(name: str) -> dict:
    with (INVALID_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


@pytest.mark.parametrize(
    "fixture_name",
    [
        "plan-door-path-node-wrong-type.json",
        "plan-station-path-node-wrong-type.json",
        "plan-room-path-node-unrelated-door.json",
        "plan-path-node-linked-object-mismatch.json",
    ],
)
def test_walking_graph_semantic_mismatches_are_rejected(fixture_name: str) -> None:
    with pytest.raises((ValidationError, ValueError)):
        PlanContract.model_validate(load_invalid_fixture(fixture_name))
