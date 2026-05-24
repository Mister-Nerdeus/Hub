from collections.abc import Iterator
from copy import deepcopy
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


def valid_simulation_run() -> dict:
    return {
        "schemaVersion": "1.0.0",
        "simulationRunId": "simulation-run-api-persistence",
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
        "limitations": ["Operational-only persistence payload."],
    }


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


def test_create_simulation_run(client: TestClient) -> None:
    response = client.post("/v1/simulation/runs", json=valid_simulation_run())

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == "simulation-run-api-persistence"
    assert body["simulationRun"] == valid_simulation_run()
    assert "createdAt" in body
    assert "updatedAt" in body


def test_list_simulation_runs(client: TestClient) -> None:
    create_response = client.post("/v1/simulation/runs", json=valid_simulation_run())
    assert create_response.status_code == 201

    response = client.get("/v1/simulation/runs")

    assert response.status_code == 200
    assert response.json()["simulationRuns"][0]["simulationRunId"] == "simulation-run-api-persistence"


def test_get_simulation_run_by_id(client: TestClient) -> None:
    create_response = client.post("/v1/simulation/runs", json=valid_simulation_run())
    assert create_response.status_code == 201

    response = client.get("/v1/simulation/runs/simulation-run-api-persistence")

    assert response.status_code == 200
    assert response.json()["simulationRun"] == valid_simulation_run()


def test_invalid_payload_rejected_before_save(client: TestClient) -> None:
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

    get_response = client.get("/v1/simulation/runs/simulation-run-api-persistence")

    assert get_response.status_code == 200
    assert get_response.json()["simulationRun"] == payload


def test_canonical_busy_until_fixture_round_trips_without_schema_mutation(client: TestClient) -> None:
    payload = read_parity_fixture("valid-nurse-busy-until.json")

    create_response = client.post("/v1/simulation/runs", json=payload)
    assert create_response.status_code == 201
    assert create_response.json()["simulationRun"] == payload

    get_response = client.get("/v1/simulation/runs/simulation-run-parity-busy-until")

    assert get_response.status_code == 200
    assert get_response.json()["simulationRun"] == payload
    write_evidence(
        "api-persistence-output.json",
        {
            "fixture": "valid-nurse-busy-until.json",
            "createStatusCode": create_response.status_code,
            "getStatusCode": get_response.status_code,
            "schemaMutation": get_response.json()["simulationRun"] != payload,
            "simulationRun": get_response.json()["simulationRun"],
        },
    )
