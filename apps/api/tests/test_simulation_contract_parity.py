import json
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from app.schemas.simulation import SimulationRunContract


ROOT = Path(__file__).resolve().parents[3]
FIXTURES_DIR = ROOT / "packages" / "shared" / "fixtures" / "simulation-contract-parity"


def fixture_names() -> list[str]:
    return sorted(path.name for path in FIXTURES_DIR.glob("*.json"))


def read_fixture(name: str) -> dict[str, Any]:
    return json.loads((FIXTURES_DIR / name).read_text(encoding="utf-8"))


def expected_result(name: str) -> str:
    return "accept" if name == "valid-minimal.json" else "reject"


def validate_fixture(name: str) -> str:
    try:
        SimulationRunContract.model_validate(read_fixture(name))
    except ValidationError:
        return "reject"
    return "accept"


def test_simulation_contract_parity_fixtures_have_expected_count() -> None:
    assert len(fixture_names()) == 11


def test_python_validator_accepts_and_rejects_parity_fixtures_as_expected() -> None:
    results = [
        {
            "fixture": name,
            "expected": expected_result(name),
            "python": validate_fixture(name),
        }
        for name in fixture_names()
    ]

    assert [(result["fixture"], result["python"]) for result in results] == [
        (result["fixture"], result["expected"]) for result in results
    ]
