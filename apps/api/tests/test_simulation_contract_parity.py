import json
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from app.schemas.simulation import SimulationRunContract


ROOT = Path(__file__).resolve().parents[3]
FIXTURES_DIR = ROOT / "packages" / "shared" / "fixtures" / "simulation-contract-parity"


def fixture_names() -> list[str]:
    return sorted(path.name for path in FIXTURES_DIR.glob("*.json") if path.name != "manifest.json")


def read_fixture(name: str) -> dict[str, Any]:
    return json.loads((FIXTURES_DIR / name).read_text(encoding="utf-8"))


def manifest_entries() -> list[dict[str, str]]:
    manifest = json.loads((FIXTURES_DIR / "manifest.json").read_text(encoding="utf-8"))
    return sorted(manifest["fixtures"], key=lambda entry: entry["fixture"])


def validate_fixture(name: str) -> str:
    try:
        SimulationRunContract.model_validate(read_fixture(name))
    except ValidationError:
        return "reject"
    return "accept"


def test_simulation_contract_parity_fixtures_have_expected_count() -> None:
    entries = manifest_entries()

    assert len(entries) == 15
    assert [entry["fixture"] for entry in entries] == fixture_names()


def test_python_validator_accepts_and_rejects_parity_fixtures_as_expected() -> None:
    results = [
        {"fixture": entry["fixture"], "expected": entry["expected"], "python": validate_fixture(entry["fixture"])}
        for entry in manifest_entries()
    ]

    assert [(result["fixture"], result["python"]) for result in results] == [
        (result["fixture"], result["expected"]) for result in results
    ]


def test_python_validator_accepts_canonical_nurse_busy_until_fixture() -> None:
    run = SimulationRunContract.model_validate(read_fixture("valid-nurse-busy-until.json"))
    nurse_events = [event for event in run.events if event.eventType == "nurse"]

    assert len(nurse_events) == 1
    assert nurse_events[0].busyUntilMinute == 6
