from collections.abc import Iterator
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.db import Base, get_db
from app.main import app


ROOT = Path(__file__).resolve().parents[3]
PARITY_FIXTURES_DIR = ROOT / "packages" / "shared" / "fixtures" / "simulation-contract-parity"
EVIDENCE_DIR = ROOT / "docs" / "verification" / "issues" / "issue-187"


def read_parity_fixture(name: str) -> dict:
    return json.loads((PARITY_FIXTURES_DIR / name).read_text(encoding="utf-8"))


def write_evidence(name: str, payload: dict) -> None:
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    (EVIDENCE_DIR / name).write_text(f"{json.dumps(payload, indent=2)}\n", encoding="utf-8")


@pytest.fixture()
def client() -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Iterator[Session]:
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)


def valid_simulation_run() -> dict:
    return {
        "schemaVersion": "1.0.0",
        "simulationRunId": "simulation-run-api-basic",
        "scenarioId": "shift-scenario-basic",
        "generatedTaskSetId": "generated-task-set-basic",
        "assignmentSetId": "manual-assignment-basic",
        "events": [],
        "summary": {
            "totalTasks": 0,
            "completedTaskCount": 0,
            "delayedTaskCount": 0,
            "missedTaskCount": 0,
            "unassignedTaskCount": 0,
        },
        "limitations": ["Operational-only validation payload."],
    }


def test_validate_endpoint_accepts_valid_payload(client: TestClient) -> None:
    response = client.post("/v1/simulation/validate", json=valid_simulation_run())

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "valid"
    assert body["limitations"] == ["Operational-only validation payload."]


def test_validate_endpoint_accepts_canonical_busy_until_fixture(client: TestClient) -> None:
    payload = read_parity_fixture("valid-nurse-busy-until.json")

    response = client.post("/v1/simulation/validate", json=payload)

    assert response.status_code == 200
    assert response.json()["simulationRunId"] == "simulation-run-parity-busy-until"
    write_evidence(
        "api-validation-output.json",
        {
            "fixture": "valid-nurse-busy-until.json",
            "statusCode": response.status_code,
            "response": response.json(),
        },
    )


def test_validate_endpoint_rejects_unknown_extra_event_field(client: TestClient) -> None:
    response = client.post(
        "/v1/simulation/validate",
        json=read_parity_fixture("invalid-extra-event-field.json"),
    )

    assert response.status_code == 422
    write_evidence(
        "negative-extra-field-output.json",
        {
            "fixture": "invalid-extra-event-field.json",
            "statusCode": response.status_code,
            "accepted": False,
        },
    )


def test_validate_endpoint_rejects_phi_like_key_fixture(client: TestClient) -> None:
    response = client.post(
        "/v1/simulation/validate",
        json=read_parity_fixture("invalid-phi-like-key.json"),
    )

    assert response.status_code == 422
    write_evidence(
        "negative-no-phi-output.json",
        {
            "fixture": "invalid-phi-like-key.json",
            "statusCode": response.status_code,
            "accepted": False,
        },
    )


def test_validate_endpoint_rejects_clinical_recommendation_text_fixture(client: TestClient) -> None:
    response = client.post(
        "/v1/simulation/validate",
        json=read_parity_fixture("invalid-clinical-recommendation-text.json"),
    )

    assert response.status_code == 422
    write_evidence(
        "negative-clinical-text-output.json",
        {
            "fixture": "invalid-clinical-recommendation-text.json",
            "statusCode": response.status_code,
            "accepted": False,
        },
    )


def test_validate_endpoint_rejects_phi_like_field(client: TestClient) -> None:
    payload = valid_simulation_run()
    payload["events"].append(
        {
            "eventId": "event-with-disallowed-key",
            "eventType": "task",
            "action": "ready",
            "taskId": "task-basic",
            "minute": 0,
            "scheduledMinute": 0,
            "patient" + "Name": "not allowed",
        }
    )

    response = client.post("/v1/simulation/validate", json=payload)

    assert response.status_code == 422


def test_validate_endpoint_rejects_diagnosis_like_field(client: TestClient) -> None:
    payload = valid_simulation_run()
    payload["diagnosis"] = "not allowed"

    response = client.post("/v1/simulation/validate", json=payload)

    assert response.status_code == 422


def test_validate_endpoint_rejects_phi_like_field_variant(client: TestClient) -> None:
    payload = valid_simulation_run()
    payload["events"].append(
        {
            "eventId": "event-with-disallowed-variant",
            "eventType": "task",
            "action": "ready",
            "taskId": "task-basic",
            "minute": 0,
            "scheduledMinute": 0,
            "medication" + "Name": "not allowed",
        }
    )

    response = client.post("/v1/simulation/validate", json=payload)

    assert response.status_code == 422


def test_validate_endpoint_rejects_invalid_event_action(client: TestClient) -> None:
    payload = valid_simulation_run()
    payload["events"].append(
        {
            "eventId": "event-with-invalid-action",
            "eventType": "task",
            "action": "made_up_action",
            "taskId": "task-basic",
            "minute": 0,
            "scheduledMinute": 0,
        }
    )
    payload["summary"]["totalTasks"] = 1

    response = client.post("/v1/simulation/validate", json=payload)

    assert response.status_code == 422


def test_validate_endpoint_rejects_ambiguous_miss_reason(client: TestClient) -> None:
    payload = valid_simulation_run()
    payload["events"].append(
        {
            "eventId": "event-with-ambiguous-miss-reason",
            "eventType": "task",
            "action": "missed",
            "taskId": "task-basic",
            "minute": 0,
            "scheduledMinute": 0,
            "missReason": "shift_window_exceeded",
        }
    )
    payload["summary"]["totalTasks"] = 1
    payload["summary"]["missedTaskCount"] = 1

    response = client.post("/v1/simulation/validate", json=payload)

    assert response.status_code == 422


def test_validate_endpoint_accepts_not_started_miss_reason(client: TestClient) -> None:
    payload = valid_simulation_run()
    payload["events"].append(
        {
            "eventId": "event-with-not-started-miss-reason",
            "eventType": "task",
            "action": "missed",
            "taskId": "task-basic",
            "minute": 0,
            "scheduledMinute": 0,
            "missReason": "not_started_shift_window_exceeded",
            "projectedStartMinute": 0,
            "projectedTravelMinutes": 0,
            "projectedCompletionMinute": 5,
            "shiftDurationMinutes": 4,
        }
    )
    payload["summary"]["totalTasks"] = 1
    payload["summary"]["missedTaskCount"] = 1

    response = client.post("/v1/simulation/validate", json=payload)

    assert response.status_code == 200


def test_validate_endpoint_rejects_paused_queue_action(client: TestClient) -> None:
    payload = valid_simulation_run()
    payload["events"].append(
        {
            "eventId": "queue-paused",
            "eventType": "queue",
            "action": "paused",
            "taskId": "task-basic",
            "nurseId": "nurse-alpha",
            "minute": 0,
            "originalReadyMinute": 0,
            "enteredQueueMinute": 0,
            "orderingReason": "Queue action validation fixture.",
        }
    )

    response = client.post("/v1/simulation/validate", json=payload)

    assert response.status_code == 422


def test_validate_endpoint_rejects_resumed_queue_action(client: TestClient) -> None:
    payload = valid_simulation_run()
    payload["events"].append(
        {
            "eventId": "queue-resumed",
            "eventType": "queue",
            "action": "resumed",
            "taskId": "task-basic",
            "nurseId": "nurse-alpha",
            "minute": 0,
            "originalReadyMinute": 0,
            "enteredQueueMinute": 0,
            "orderingReason": "Queue action validation fixture.",
        }
    )

    response = client.post("/v1/simulation/validate", json=payload)

    assert response.status_code == 422


def test_validate_endpoint_rejects_duplicate_event_ids(client: TestClient) -> None:
    payload = valid_simulation_run()
    payload["events"] = [
        {
            "eventId": "event-duplicate",
            "eventType": "task",
            "action": "ready",
            "taskId": "task-basic",
            "minute": 0,
            "scheduledMinute": 0,
        },
        {
            "eventId": "event-duplicate",
            "eventType": "task",
            "action": "completed",
            "taskId": "task-basic",
            "minute": 5,
            "scheduledMinute": 0,
            "completedMinute": 5,
        },
    ]
    payload["summary"]["totalTasks"] = 1
    payload["summary"]["completedTaskCount"] = 1

    response = client.post("/v1/simulation/validate", json=payload)

    assert response.status_code == 422


def test_validate_endpoint_does_not_write_database(client: TestClient) -> None:
    response = client.post("/v1/simulation/validate", json=valid_simulation_run())

    assert response.status_code == 200
    assert client.get("/v1/simulation/runs").json()["simulationRuns"] == []
