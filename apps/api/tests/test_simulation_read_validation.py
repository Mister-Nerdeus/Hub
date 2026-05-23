from collections.abc import Iterator
from copy import deepcopy
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.db import Base, get_db
from app.main import app
from app.models import SimulationRunRecord


def valid_simulation_run(run_id: str = "simulation-run-read-validation") -> dict:
    return {
        "schemaVersion": "1.0.0",
        "simulationRunId": run_id,
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
        "limitations": ["Operational-only read validation payload."],
    }


@pytest.fixture()
def db_client() -> Iterator[tuple[TestClient, sessionmaker[Session]]]:
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
        yield TestClient(app), testing_session_local
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)


def insert_stored_run(
    session_factory: sessionmaker[Session],
    run_id: str,
    payload: dict,
    created_at: datetime | None = None,
) -> None:
    timestamp = created_at or datetime.now(timezone.utc)
    with session_factory() as db:
        db.add(
            SimulationRunRecord(
                id=run_id,
                simulation_json=payload,
                created_at=timestamp,
                updated_at=timestamp,
            )
        )
        db.commit()


def test_default_limit_and_pagination_shape(db_client: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, _ = db_client

    response = client.get("/v1/simulation/runs")

    assert response.status_code == 200
    assert response.json() == {
        "simulationRuns": [],
        "pagination": {
            "limit": 50,
            "offset": 0,
            "returned": 0,
        },
    }


def test_max_limit_enforced(db_client: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, _ = db_client

    response = client.get("/v1/simulation/runs?limit=101")

    assert response.status_code == 422


def test_offset_works(db_client: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, session_factory = db_client
    for index in range(3):
        run_id = f"simulation-run-read-validation-{index}"
        insert_stored_run(session_factory, run_id, valid_simulation_run(run_id))

    response = client.get("/v1/simulation/runs?limit=1&offset=1")

    assert response.status_code == 200
    body = response.json()
    assert body["pagination"] == {"limit": 1, "offset": 1, "returned": 1}
    assert body["simulationRuns"][0]["simulationRunId"] == "simulation-run-read-validation-1"


def test_valid_run_round_trips_unchanged(db_client: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, _ = db_client
    payload = deepcopy(valid_simulation_run())

    create_response = client.post("/v1/simulation/runs", json=payload)
    assert create_response.status_code == 201

    response = client.get("/v1/simulation/runs/simulation-run-read-validation")

    assert response.status_code == 200
    assert response.json()["simulationRun"] == payload


def test_invalid_persisted_json_returns_deterministic_error(
    db_client: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = db_client
    payload = valid_simulation_run()
    payload["summary"]["totalTasks"] = 1
    insert_stored_run(session_factory, "simulation-run-read-validation", payload)

    response = client.get("/v1/simulation/runs/simulation-run-read-validation")

    assert response.status_code == 500
    assert response.json() == {"detail": "persisted simulation run failed validation"}


def test_phi_like_persisted_payload_blocked_on_read(
    db_client: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = db_client
    payload = valid_simulation_run()
    payload["events"].append(
        {
            "eventId": "event-with-disallowed-read-key",
            "eventType": "task",
            "action": "ready",
            "taskId": "task-basic",
            "minute": 0,
            "scheduledMinute": 0,
            "patient" + "Name": "blocked",
        }
    )
    insert_stored_run(session_factory, "simulation-run-read-validation", payload)

    response = client.get("/v1/simulation/runs/simulation-run-read-validation")

    assert response.status_code == 500
    assert response.json() == {"detail": "persisted simulation run failed validation"}
