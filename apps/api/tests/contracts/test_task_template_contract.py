import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.contracts import TaskTemplateContract

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "packages" / "shared" / "fixtures"
INVALID_FIXTURES = FIXTURES / "invalid"


def load_fixture(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_invalid_fixture(name: str) -> dict:
    with (INVALID_FIXTURES / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def test_task_template_fixture_matches_python_contract() -> None:
    task_templates = TaskTemplateContract.model_validate(load_fixture("task-templates-basic.json"))

    assert task_templates.schemaVersion == "1.0.0"
    assert task_templates.templateSetId == "task-templates-basic"
    assert len(task_templates.taskTemplates) == 7
    assert task_templates.taskTemplates[0].frequencySource == "room_load_frequency"


def test_boolean_trigger_frequency_source_mismatch_is_rejected() -> None:
    task_templates = load_fixture("task-templates-basic.json")
    task_templates["taskTemplates"][4]["frequencySource"] = "room_load_frequency"

    with pytest.raises((ValidationError, ValueError)):
        TaskTemplateContract.model_validate(task_templates)


@pytest.mark.parametrize(
    "fixture_name",
    [
        "task-template-bad-type.json",
        "task-template-bad-trigger.json",
        "task-template-bad-duration.json",
        "task-template-duplicate-id.json",
    ],
)
def test_invalid_task_template_fixtures_are_rejected(fixture_name: str) -> None:
    with pytest.raises((ValidationError, ValueError)):
        TaskTemplateContract.model_validate(load_invalid_fixture(fixture_name))
