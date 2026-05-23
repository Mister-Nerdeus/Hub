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
        "simulationRunId": "simulation-reference-integrity-api",
        "scenarioId": "shift-scenario-reference-integrity",
        "generatedTaskSetId": "generated-task-set-reference-integrity",
        "assignmentSetId": "assignment-set-reference-integrity",
        "events": [],
        "summary": {
            "totalTasks": 0,
            "completedTaskCount": 0,
            "delayedTaskCount": 0,
            "missedTaskCount": 0,
            "unassignedTaskCount": 0,
        },
        "limitations": ["Operational-only reference integrity validation payload."],
    }


def post_validation(client: TestClient, event: dict) -> int:
    payload = valid_simulation_run()
    payload["events"].append(event)
    return client.post("/v1/simulation/validate", json=payload).status_code


def test_validate_endpoint_rejects_orphan_queue_task_reference(client: TestClient) -> None:
    status_code = post_validation(
        client,
        {
            "eventId": "queue-orphan-task",
            "eventType": "queue",
            "action": "entered_queue",
            "taskId": "missing-task-id",
            "nurseId": "nurse-alpha",
            "minute": 0,
            "originalReadyMinute": 0,
            "enteredQueueMinute": 0,
            "orderingReason": "Orphan queue event must fail.",
        },
    )

    assert status_code == 422


def test_validate_endpoint_rejects_orphan_travel_task_reference(client: TestClient) -> None:
    status_code = post_validation(
        client,
        {
            "eventId": "travel-orphan-task",
            "eventType": "travel",
            "action": "travel_calculated",
            "taskId": "missing-task-id",
            "nurseId": "nurse-alpha",
            "minute": 0,
            "originNodeId": "nurse-station",
            "destinationNodeId": "room-1",
            "routeNodeIds": ["nurse-station", "room-1"],
            "routeEdgeIds": ["edge-nurse-station-room-1"],
            "travelSeconds": 30,
            "travelMinutes": 1,
            "warnings": [],
        },
    )

    assert status_code == 422


def test_validate_endpoint_rejects_orphan_nurse_task_reference(client: TestClient) -> None:
    status_code = post_validation(
        client,
        {
            "eventId": "nurse-orphan-task",
            "eventType": "nurse",
            "action": "started_task",
            "taskId": "missing-task-id",
            "nurseId": "nurse-alpha",
            "minute": 0,
            "durationMinutes": 5,
        },
    )

    assert status_code == 422


def test_validate_endpoint_accepts_known_non_task_references(client: TestClient) -> None:
    payload = valid_simulation_run()
    payload["events"] = [
        {
            "eventId": "task-ready",
            "eventType": "task",
            "action": "ready",
            "taskId": "task-alpha",
            "minute": 0,
            "scheduledMinute": 0,
        },
        {
            "eventId": "queue-known-task",
            "eventType": "queue",
            "action": "entered_queue",
            "taskId": "task-alpha",
            "nurseId": "nurse-alpha",
            "minute": 0,
            "originalReadyMinute": 0,
            "enteredQueueMinute": 0,
            "orderingReason": "Known task reference validation fixture.",
        },
        {
            "eventId": "travel-known-task",
            "eventType": "travel",
            "action": "travel_calculated",
            "taskId": "task-alpha",
            "nurseId": "nurse-alpha",
            "minute": 0,
            "originNodeId": "nurse-station",
            "destinationNodeId": "room-1",
            "routeNodeIds": ["nurse-station", "room-1"],
            "routeEdgeIds": ["edge-nurse-station-room-1"],
            "travelSeconds": 30,
            "travelMinutes": 1,
            "warnings": [],
        },
        {
            "eventId": "nurse-known-task",
            "eventType": "nurse",
            "action": "started_task",
            "taskId": "task-alpha",
            "nurseId": "nurse-alpha",
            "minute": 0,
            "durationMinutes": 5,
        },
    ]
    payload["summary"]["totalTasks"] = 1

    response = client.post("/v1/simulation/validate", json=payload)

    assert response.status_code == 200
