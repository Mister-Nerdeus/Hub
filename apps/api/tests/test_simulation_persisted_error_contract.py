from collections.abc import Iterator
from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.db import Base, get_db
from app.main import app
from app.models import SimulationRunRecord


ROOT = Path(__file__).resolve().parents[3]
EVIDENCE_PATH = (
    ROOT
    / "docs"
    / "verification"
    / "issues"
    / "issue-111"
    / "api-responses"
    / "invalid-persisted-run-error.json"
)
INVALID_PERSISTED_DETAIL = {
    "detail": {
        "code": "PERSISTED_SIMULATION_RUN_INVALID",
        "message": "persisted simulation run failed validation",
    }
}


def valid_simulation_run() -> dict:
    return {
        "schemaVersion": "1.0.0",
        "simulationRunId": "simulation-run-persisted-error-contract",
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
        "limitations": ["Operational-only persisted error payload."],
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


def insert_stored_run(session_factory: sessionmaker[Session], payload: dict) -> None:
    timestamp = datetime.now(timezone.utc)
    with session_factory() as db:
        db.add(
            SimulationRunRecord(
                id="simulation-run-persisted-error-contract",
                simulation_json=payload,
                created_at=timestamp,
                updated_at=timestamp,
            )
        )
        db.commit()


def test_invalid_persisted_json_returns_structured_error(
    db_client: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = db_client
    payload = valid_simulation_run()
    payload["summary"]["totalTasks"] = 1
    insert_stored_run(session_factory, payload)

    response = client.get("/v1/simulation/runs/simulation-run-persisted-error-contract")

    assert response.status_code == 500
    assert response.json() == INVALID_PERSISTED_DETAIL


def test_invalid_persisted_json_does_not_leak_raw_payload(
    db_client: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = db_client
    payload = valid_simulation_run()
    payload["summary"]["totalTasks"] = 1
    payload["limitations"] = ["Operational-only raw-payload-marker."]
    insert_stored_run(session_factory, payload)

    response = client.get("/v1/simulation/runs/simulation-run-persisted-error-contract")

    assert response.status_code == 500
    assert response.json() == INVALID_PERSISTED_DETAIL
    assert "raw-payload-marker" not in response.text
    assert "simulationRun" not in response.json()


def test_invalid_persisted_json_response_evidence(
    db_client: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = db_client
    payload = valid_simulation_run()
    payload["summary"]["totalTasks"] = 1
    insert_stored_run(session_factory, payload)

    response = client.get("/v1/simulation/runs/simulation-run-persisted-error-contract")

    assert response.status_code == 500
    assert response.json() == INVALID_PERSISTED_DETAIL
    EVIDENCE_PATH.parent.mkdir(parents=True, exist_ok=True)
    EVIDENCE_PATH.write_text(f"{response.text}\n", encoding="utf-8")
