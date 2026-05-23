from collections.abc import Iterator
from copy import deepcopy

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


def test_validate_endpoint_does_not_write_database(client: TestClient) -> None:
    response = client.post("/v1/simulation/validate", json=valid_simulation_run())

    assert response.status_code == 200
    assert client.get("/v1/simulation/runs").json()["simulationRuns"] == []


def test_create_simulation_run(client: TestClient) -> None:
    response = client.post("/v1/simulation/runs", json=valid_simulation_run())

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == "simulation-run-api-basic"
    assert body["simulationRun"] == valid_simulation_run()
    assert "createdAt" in body
    assert "updatedAt" in body


def test_list_simulation_runs(client: TestClient) -> None:
    create_response = client.post("/v1/simulation/runs", json=valid_simulation_run())
    assert create_response.status_code == 201

    response = client.get("/v1/simulation/runs")

    assert response.status_code == 200
    assert response.json()["simulationRuns"][0]["simulationRunId"] == "simulation-run-api-basic"


def test_get_simulation_run_by_id(client: TestClient) -> None:
    create_response = client.post("/v1/simulation/runs", json=valid_simulation_run())
    assert create_response.status_code == 201

    response = client.get("/v1/simulation/runs/simulation-run-api-basic")

    assert response.status_code == 200
    assert response.json()["simulationRun"] == valid_simulation_run()


def test_invalid_payload_rejected(client: TestClient) -> None:
    payload = valid_simulation_run()
    payload["summary"]["totalTasks"] = 1

    response = client.post("/v1/simulation/runs", json=payload)

    assert response.status_code == 422
    assert client.get("/v1/simulation/runs").json()["simulationRuns"] == []


def test_phi_like_payload_rejected_before_save(client: TestClient) -> None:
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

    response = client.post("/v1/simulation/runs", json=payload)

    assert response.status_code == 422
    assert client.get("/v1/simulation/runs").json()["simulationRuns"] == []


def test_round_trip_json_equality(client: TestClient) -> None:
    payload = deepcopy(valid_simulation_run())
    create_response = client.post("/v1/simulation/runs", json=payload)
    assert create_response.status_code == 201

    get_response = client.get("/v1/simulation/runs/simulation-run-api-basic")

    assert get_response.status_code == 200
    assert get_response.json()["simulationRun"] == payload
