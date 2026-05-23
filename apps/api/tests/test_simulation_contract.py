from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.db import Base, get_db
from app.main import app


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
        }
    )
    payload["summary"]["totalTasks"] = 1
    payload["summary"]["missedTaskCount"] = 1

    response = client.post("/v1/simulation/validate", json=payload)

    assert response.status_code == 200


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
