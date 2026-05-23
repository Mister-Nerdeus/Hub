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


def payload_with_event(event: dict) -> dict:
    return {
        "schemaVersion": "1.0.0",
        "simulationRunId": "simulation-missed-task-explanation-api",
        "scenarioId": "shift-scenario-missed-task-explanation",
        "generatedTaskSetId": "generated-task-set-missed-task-explanation",
        "assignmentSetId": "assignment-set-missed-task-explanation",
        "events": [
            {
                "eventId": "task-missed-explanation-ready",
                "eventType": "task",
                "action": "ready",
                "taskId": "task-missed-explanation",
                "minute": 15,
                "scheduledMinute": 15,
            },
            event,
        ],
        "summary": {
            "totalTasks": 1,
            "completedTaskCount": 0,
            "delayedTaskCount": 0,
            "missedTaskCount": 1,
            "unassignedTaskCount": 0,
        },
        "limitations": ["Operational-only missed task explanation validation payload."],
    }


def missed_event() -> dict:
    return {
        "eventId": "task-missed-explanation-missed",
        "eventType": "task",
        "action": "missed",
        "taskId": "task-missed-explanation",
        "nurseId": "nurse-alpha",
        "minute": 15,
        "scheduledMinute": 15,
        "missReason": "not_started_shift_window_exceeded",
    }


def test_validate_endpoint_rejects_not_started_missed_event_without_projected_fields(
    client: TestClient,
) -> None:
    response = client.post("/v1/simulation/validate", json=payload_with_event(missed_event()))

    assert response.status_code == 422


def test_validate_endpoint_accepts_not_started_missed_event_with_projected_fields(
    client: TestClient,
) -> None:
    event = {
        **missed_event(),
        "projectedStartMinute": 15,
        "projectedTravelMinutes": 0,
        "projectedCompletionMinute": 21,
        "shiftDurationMinutes": 20,
    }

    response = client.post("/v1/simulation/validate", json=payload_with_event(event))

    assert response.status_code == 200
