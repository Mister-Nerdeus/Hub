from copy import deepcopy
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app import models  # noqa: F401
from tests.fixtures.plan_phase2 import load_phase2_plan


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


def plan_request(description: str | None = "Synthetic operational layout") -> dict:
    return {"description": description, "layout": load_phase2_plan()}


def create_plan(client: TestClient) -> dict:
    response = client.post("/v1/plans", json=plan_request())
    assert response.status_code == 201
    return response.json()


def test_create_plan_validates_and_persists_layout(client: TestClient) -> None:
    body = create_plan(client)

    assert body["id"] == "plan-er-pod-phase2"
    assert body["name"] == "Phase 2 ER Pod Layout"
    assert body["description"] == "Synthetic operational layout"
    assert body["layout"]["rooms"][0]["id"] == "room-01"
    assert "createdAt" in body
    assert "updatedAt" in body


def test_list_and_get_plan(client: TestClient) -> None:
    create_plan(client)

    list_response = client.get("/v1/plans")
    assert list_response.status_code == 200
    assert list_response.json()["plans"][0]["id"] == "plan-er-pod-phase2"

    get_response = client.get("/v1/plans/plan-er-pod-phase2")
    assert get_response.status_code == 200
    assert get_response.json()["layout"]["pathEdges"][0]["lengthFeet"] > 0


def test_update_plan_replaces_valid_layout(client: TestClient) -> None:
    create_plan(client)
    updated = deepcopy(load_phase2_plan())
    updated["name"] = "Updated Phase 2 ER Pod Layout"
    updated["rooms"][0]["widthFeet"] = 13

    response = client.put(
        "/v1/plans/plan-er-pod-phase2",
        json={"description": "Updated operational layout", "layout": updated},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Updated Phase 2 ER Pod Layout"
    assert body["description"] == "Updated operational layout"
    assert body["layout"]["rooms"][0]["widthFeet"] == 13


def test_delete_plan_removes_record(client: TestClient) -> None:
    create_plan(client)

    delete_response = client.delete("/v1/plans/plan-er-pod-phase2")
    assert delete_response.status_code == 204

    get_response = client.get("/v1/plans/plan-er-pod-phase2")
    assert get_response.status_code == 404


def test_invalid_plan_payload_is_rejected(client: TestClient) -> None:
    invalid = deepcopy(load_phase2_plan())
    invalid["pathEdges"][0]["toNodeId"] = "node-missing"

    response = client.post("/v1/plans", json={"description": None, "layout": invalid})

    assert response.status_code == 422


def test_unknown_request_field_is_rejected(client: TestClient) -> None:
    request = plan_request()
    request["unknown"] = "not allowed"

    response = client.post("/v1/plans", json=request)

    assert response.status_code == 422


def test_unknown_layout_field_is_rejected(client: TestClient) -> None:
    request = plan_request()
    request["layout"]["unknown"] = "not allowed"

    response = client.post("/v1/plans", json=request)

    assert response.status_code == 422


def test_update_requires_route_id_to_match_layout_id(client: TestClient) -> None:
    create_plan(client)
    updated = deepcopy(load_phase2_plan())
    updated["planId"] = "different-plan-id"

    response = client.put(
        "/v1/plans/plan-er-pod-phase2",
        json={"description": None, "layout": updated},
    )

    assert response.status_code == 400
