from collections.abc import Iterator
from copy import deepcopy
from datetime import datetime, timezone
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
from app.models import SimulationRunRecord


ROOT = Path(__file__).resolve().parents[3]
PLAN_FIXTURE = ROOT / "packages" / "shared" / "fixtures" / "plan-er-pod-phase2.json"
EVIDENCE_DIR = ROOT / "docs" / "verification" / "issues" / "issue-193"


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


def load_plan() -> dict:
    return json.loads(PLAN_FIXTURE.read_text(encoding="utf-8"))


def plan_request(plan: dict | None = None) -> dict:
    layout = load_plan() if plan is None else plan
    return {"description": layout["description"], "layout": layout}


def valid_simulation_run(run_id: str = "simulation-run-error-contract") -> dict:
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
        "limitations": ["Operational-only error contract payload."],
    }


def assert_error_code(response, status_code: int, code: str) -> None:
    assert response.status_code == status_code
    body = response.json()
    assert body["detail"]["code"] == code
    assert isinstance(body["detail"]["message"], str)
    assert "simulationRun" not in body["detail"]


def test_plan_error_codes(db_client: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, _ = db_client
    create_response = client.post("/v1/plans", json=plan_request())
    assert create_response.status_code == 201

    assert_error_code(client.post("/v1/plans", json=plan_request()), 409, "PLAN_ALREADY_EXISTS")
    assert_error_code(client.get("/v1/plans/missing-plan"), 404, "PLAN_NOT_FOUND")

    mismatched = load_plan()
    mismatched["planId"] = "different-plan-id"
    assert_error_code(
        client.put("/v1/plans/plan-er-pod-phase2", json={"description": None, "layout": mismatched}),
        400,
        "PLAN_ID_MISMATCH",
    )

    invalid = load_plan()
    invalid["pathEdges"][0]["toNodeId"] = "node-missing"
    assert_error_code(
        client.post("/v1/plans", json=plan_request(invalid)),
        422,
        "PLAN_CONTRACT_INVALID",
    )


def test_simulation_error_codes(db_client: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, _ = db_client
    invalid = valid_simulation_run()
    invalid["summary"]["totalTasks"] = 1
    assert_error_code(
        client.post("/v1/simulation/runs", json=invalid),
        422,
        "SIMULATION_RUN_CONTRACT_INVALID",
    )

    create_response = client.post("/v1/simulation/runs", json=valid_simulation_run())
    assert create_response.status_code == 201

    assert_error_code(
        client.post("/v1/simulation/runs", json=valid_simulation_run()),
        409,
        "SIMULATION_RUN_ALREADY_EXISTS",
    )
    assert_error_code(
        client.get("/v1/simulation/runs/missing-run"),
        404,
        "SIMULATION_RUN_NOT_FOUND",
    )


def test_validation_no_phi_and_persisted_error_codes(
    db_client: tuple[TestClient, sessionmaker[Session]],
) -> None:
    client, session_factory = db_client
    assert_error_code(
        client.get("/v1/simulation/runs?limit=101"),
        422,
        "REQUEST_VALIDATION_FAILED",
    )

    no_phi_plan = load_plan()
    rejected_value = "John Smith"
    no_phi_plan["rooms"][0]["label"] = rejected_value
    no_phi_response = client.post("/v1/plans", json=plan_request(no_phi_plan))
    assert_error_code(no_phi_response, 422, "NO_PHI_RUNTIME_REJECTION")
    assert rejected_value not in no_phi_response.text

    payload = valid_simulation_run("simulation-run-invalid-persisted")
    payload["summary"]["totalTasks"] = 1
    payload["limitations"] = ["Operational-only invalid-persisted-marker."]
    with session_factory() as db:
        db.add(
            SimulationRunRecord(
                id="simulation-run-invalid-persisted",
                simulation_json=payload,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
        )
        db.commit()

    persisted_response = client.get("/v1/simulation/runs/simulation-run-invalid-persisted")
    assert_error_code(persisted_response, 500, "PERSISTED_SIMULATION_RUN_INVALID")
    assert "invalid-persisted-marker" not in persisted_response.text


def test_api_error_contract_evidence(db_client: tuple[TestClient, sessionmaker[Session]]) -> None:
    client, session_factory = db_client
    create_plan_response = client.post("/v1/plans", json=plan_request())
    assert create_plan_response.status_code == 201

    mismatched = load_plan()
    mismatched["planId"] = "different-plan-id"

    invalid_plan = load_plan()
    invalid_plan["pathEdges"][0]["toNodeId"] = "node-missing"

    invalid_run = valid_simulation_run("simulation-run-invalid-body")
    invalid_run["summary"]["totalTasks"] = 1

    create_run_response = client.post("/v1/simulation/runs", json=valid_simulation_run())
    assert create_run_response.status_code == 201

    no_phi_plan = load_plan()
    no_phi_plan["rooms"][0]["label"] = "John Smith"

    persisted_payload = valid_simulation_run("simulation-run-invalid-persisted")
    persisted_payload["summary"]["totalTasks"] = 1
    with session_factory() as db:
        db.add(
            SimulationRunRecord(
                id="simulation-run-invalid-persisted",
                simulation_json=persisted_payload,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
        )
        db.commit()

    responses = {
        "PLAN_ALREADY_EXISTS": client.post("/v1/plans", json=plan_request()),
        "PLAN_NOT_FOUND": client.get("/v1/plans/missing-plan"),
        "PLAN_ID_MISMATCH": client.put(
            "/v1/plans/plan-er-pod-phase2",
            json={"description": None, "layout": mismatched},
        ),
        "PLAN_CONTRACT_INVALID": client.post("/v1/plans", json=plan_request(invalid_plan)),
        "SIMULATION_RUN_CONTRACT_INVALID": client.post("/v1/simulation/runs", json=invalid_run),
        "SIMULATION_RUN_ALREADY_EXISTS": client.post(
            "/v1/simulation/runs",
            json=valid_simulation_run(),
        ),
        "SIMULATION_RUN_NOT_FOUND": client.get("/v1/simulation/runs/missing-run"),
        "PERSISTED_SIMULATION_RUN_INVALID": client.get(
            "/v1/simulation/runs/simulation-run-invalid-persisted"
        ),
        "NO_PHI_RUNTIME_REJECTION": client.post("/v1/plans", json=plan_request(no_phi_plan)),
        "REQUEST_VALIDATION_FAILED": client.get("/v1/simulation/runs?limit=101"),
    }
    output = {
        code: {
            "statusCode": response.status_code,
            "body": response.json(),
        }
        for code, response in responses.items()
    }
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    (EVIDENCE_DIR / "api-error-contract-output.json").write_text(
        f"{json.dumps(output, indent=2)}\n",
        encoding="utf-8",
    )
