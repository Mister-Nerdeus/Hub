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


def payload_with_events(events: list[dict], **summary_overrides: int) -> dict:
    summary = {
        "totalTasks": 1,
        "completedTaskCount": 0,
        "delayedTaskCount": 0,
        "missedTaskCount": 0,
        "unassignedTaskCount": 0,
    }
    summary.update(summary_overrides)
    return {
        "schemaVersion": "1.0.0",
        "simulationRunId": "simulation-lifecycle-ordering-api",
        "scenarioId": "shift-scenario-lifecycle-ordering",
        "generatedTaskSetId": "generated-task-set-lifecycle-ordering",
        "assignmentSetId": "assignment-set-lifecycle-ordering",
        "events": events,
        "summary": summary,
        "limitations": ["Operational-only lifecycle ordering validation payload."],
    }


def ready(task_id: str = "task-alpha", minute: int = 0) -> dict:
    return {
        "eventId": f"{task_id}-ready",
        "eventType": "task",
        "action": "ready",
        "taskId": task_id,
        "minute": minute,
        "scheduledMinute": minute,
    }


def started(task_id: str = "task-alpha", minute: int = 0) -> dict:
    return {
        "eventId": f"{task_id}-started-{minute}",
        "eventType": "task",
        "action": "started",
        "taskId": task_id,
        "nurseId": "nurse-alpha",
        "minute": minute,
        "scheduledMinute": 0,
        "startMinute": minute,
        "durationMinutes": 5,
    }


def completed(task_id: str = "task-alpha", start_minute: int = 0, completed_minute: int = 5) -> dict:
    return {
        "eventId": f"{task_id}-completed-{completed_minute}",
        "eventType": "task",
        "action": "completed",
        "taskId": task_id,
        "nurseId": "nurse-alpha",
        "minute": completed_minute,
        "scheduledMinute": 0,
        "startMinute": start_minute,
        "completedMinute": completed_minute,
        "durationMinutes": 5,
    }


def missed(task_id: str = "task-alpha", minute: int = 5) -> dict:
    return {
        "eventId": f"{task_id}-missed",
        "eventType": "task",
        "action": "missed",
        "taskId": task_id,
        "minute": minute,
        "scheduledMinute": 0,
        "missReason": "not_started_shift_window_exceeded",
    }


def unassigned(task_id: str = "task-alpha") -> dict:
    return {
        "eventId": f"{task_id}-unassigned",
        "eventType": "task",
        "action": "unassigned",
        "taskId": task_id,
        "minute": 0,
        "scheduledMinute": 0,
        "missReason": "unassigned",
    }


def delayed(task_id: str = "task-alpha", minute: int = 5) -> dict:
    return {
        "eventId": f"{task_id}-delayed",
        "eventType": "task",
        "action": "delayed",
        "taskId": task_id,
        "nurseId": "nurse-alpha",
        "minute": minute,
        "scheduledMinute": 0,
        "startMinute": minute,
        "delayMinutes": minute,
        "queueWaitMinutes": minute,
        "travelMinutes": 0,
    }


def assert_rejected(client: TestClient, events: list[dict], **summary_overrides: int) -> None:
    response = client.post("/v1/simulation/validate", json=payload_with_events(events, **summary_overrides))

    assert response.status_code == 422


def test_validate_endpoint_rejects_completed_without_started(client: TestClient) -> None:
    assert_rejected(client, [ready(), completed()], completedTaskCount=1)


def test_validate_endpoint_rejects_started_without_ready(client: TestClient) -> None:
    assert_rejected(client, [started()])


def test_validate_endpoint_rejects_completed_before_started(client: TestClient) -> None:
    assert_rejected(
        client,
        [ready(), started("task-alpha", 10), completed("task-alpha", 10, 5)],
        completedTaskCount=1,
    )


def test_validate_endpoint_rejects_started_before_ready(client: TestClient) -> None:
    assert_rejected(client, [ready("task-alpha", 10), started("task-alpha", 5)])


def test_validate_endpoint_rejects_missed_and_completed(client: TestClient) -> None:
    assert_rejected(client, [ready(), started(), completed(), missed()], completedTaskCount=1, missedTaskCount=1)


def test_validate_endpoint_rejects_unassigned_and_completed(client: TestClient) -> None:
    assert_rejected(
        client,
        [ready(), started(), completed(), unassigned()],
        completedTaskCount=1,
        unassignedTaskCount=1,
    )


def test_validate_endpoint_rejects_multiple_terminal_states(client: TestClient) -> None:
    assert_rejected(client, [ready(), missed(), unassigned()], missedTaskCount=1, unassignedTaskCount=1)


def test_validate_endpoint_rejects_delayed_without_start_or_miss(client: TestClient) -> None:
    assert_rejected(client, [ready(), delayed()], delayedTaskCount=1)


def test_validate_endpoint_accepts_coherent_delayed_completed_lifecycle(client: TestClient) -> None:
    response = client.post(
        "/v1/simulation/validate",
        json=payload_with_events(
            [ready(), delayed("task-alpha", 5), started("task-alpha", 5), completed("task-alpha", 5, 10)],
            completedTaskCount=1,
            delayedTaskCount=1,
        ),
    )

    assert response.status_code == 200


def test_validate_endpoint_accepts_delayed_missed_lifecycle(client: TestClient) -> None:
    response = client.post(
        "/v1/simulation/validate",
        json=payload_with_events(
            [ready(), delayed("task-alpha", 5), missed("task-alpha", 10)],
            delayedTaskCount=1,
            missedTaskCount=1,
        ),
    )

    assert response.status_code == 200
