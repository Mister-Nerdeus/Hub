import json
from copy import deepcopy
from pathlib import Path
from typing import Any

import pytest

from app.contracts import (
    NO_PHI_RUNTIME_REJECTION_CODE,
    DayProfileContract,
    PlanContract,
    TaskTemplateContract,
    validate_manual_assignment_contract,
    validate_operational_report_contract,
    validate_report_export_bundle_contract,
    validate_shift_scenario_contract,
)
from app.schemas.simulation import SimulationRunContract

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"
NEGATIVE_FIXTURES = FIXTURES / "no-phi-negative"
POSITIVE_FIXTURES = FIXTURES / "no-phi-positive"


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_fixture(relative_path: str) -> Any:
    return load_json(FIXTURES / relative_path)


def apply_mutation(source: Any, path: list[str | int], value: str) -> Any:
    target = deepcopy(source)
    cursor = target
    for segment in path[:-1]:
        cursor = cursor[segment]
    cursor[path[-1]] = value
    return target


def validate_fixture(object_type: str, value: Any) -> Any:
    validators = {
        "plan": PlanContract.model_validate,
        "scenario": validate_shift_scenario_contract,
        "manualAssignment": validate_manual_assignment_contract,
        "simulationRun": SimulationRunContract.model_validate,
        "report": validate_operational_report_contract,
        "exportBundle": validate_report_export_bundle_contract,
        "taskTemplate": TaskTemplateContract.model_validate,
        "dayProfile": DayProfileContract.model_validate,
    }
    return validators[object_type](value)


def test_no_phi_negative_object_fixtures_fail_deterministically() -> None:
    fixture_names = sorted(path.name for path in NEGATIVE_FIXTURES.glob("*.json"))
    assert len(fixture_names) == 8

    for fixture_name in fixture_names:
        fixture = load_json(NEGATIVE_FIXTURES / fixture_name)
        mutated = apply_mutation(
            load_fixture(fixture["sourceFixture"]),
            fixture["mutationPath"],
            fixture["rejectedValue"],
        )
        with pytest.raises(ValueError) as exc_info:
            validate_fixture(fixture["objectType"], mutated)
        message = str(exc_info.value)
        assert NO_PHI_RUNTIME_REJECTION_CODE in message
        assert fixture["rejectedValue"] not in message


def test_no_phi_positive_object_fixtures_pass() -> None:
    fixtures = load_json(POSITIVE_FIXTURES / "object-fixtures.json")
    assert len(fixtures) == 8

    for fixture in fixtures:
        assert validate_fixture(
            fixture["objectType"],
            load_fixture(fixture["sourceFixture"]),
        )
