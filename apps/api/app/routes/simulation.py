from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.errors import (
    PERSISTED_SIMULATION_RUN_INVALID,
    SIMULATION_RUN_ALREADY_EXISTS,
    SIMULATION_RUN_NOT_FOUND,
    error_detail,
    api_error,
)
from app.models import SimulationRunRecord
from app.repositories import simulation_runs as simulation_run_repository
from app.schemas.simulation import (
    SimulationRunContract,
    persisted_simulation_run_invalid_detail,
    validate_persisted_simulation_run,
)

router = APIRouter(prefix="/v1/simulation", tags=["simulation"])

DEFAULT_SIMULATION_RUN_LIST_LIMIT = 50
MAX_SIMULATION_RUN_LIST_LIMIT = 100


def serialize_timestamp(value: datetime) -> str:
    return value.isoformat()


def validation_response(simulation_run: SimulationRunContract) -> dict[str, Any]:
    return {
        "status": "valid",
        "simulationRunId": simulation_run.simulationRunId,
        "scenarioId": simulation_run.scenarioId,
        "generatedTaskSetId": simulation_run.generatedTaskSetId,
        "assignmentSetId": simulation_run.assignmentSetId,
        "limitations": simulation_run.limitations,
    }


def validated_simulation_json(record: SimulationRunRecord) -> dict[str, Any]:
    try:
        return validate_persisted_simulation_run(record.simulation_json)
    except (ValidationError, ValueError) as exc:
        raise HTTPException(
            status_code=500,
            detail=persisted_simulation_run_invalid_detail(),
        ) from exc


def serialize_run(record: SimulationRunRecord) -> dict[str, Any]:
    simulation_run = validated_simulation_json(record)
    return {
        "id": record.id,
        "simulationRun": simulation_run,
        "createdAt": serialize_timestamp(record.created_at),
        "updatedAt": serialize_timestamp(record.updated_at),
    }


def serialize_run_summary(record: SimulationRunRecord) -> dict[str, Any]:
    try:
        simulation_run = validated_simulation_json(record)
        return {
            "id": record.id,
            "simulationRunId": simulation_run["simulationRunId"],
            "scenarioId": simulation_run["scenarioId"],
            "createdAt": serialize_timestamp(record.created_at),
            "updatedAt": serialize_timestamp(record.updated_at),
        }
    except HTTPException as exc:
        detail = exc.detail if isinstance(exc.detail, dict) else error_detail(PERSISTED_SIMULATION_RUN_INVALID)
        return {
            "id": record.id,
            "status": "invalid",
            "code": detail.get("code", PERSISTED_SIMULATION_RUN_INVALID),
            "createdAt": serialize_timestamp(record.created_at),
            "updatedAt": serialize_timestamp(record.updated_at),
        }


@router.post("/validate")
def validate_simulation_run(simulation_run: SimulationRunContract) -> dict[str, Any]:
    return validation_response(simulation_run)


@router.post("/runs", status_code=status.HTTP_201_CREATED)
def create_simulation_run(
    simulation_run: SimulationRunContract,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    payload = simulation_run.model_dump(mode="json", exclude_none=True)
    try:
        record = simulation_run_repository.create_simulation_run(
            db,
            simulation_run_id=simulation_run.simulationRunId,
            simulation_json=payload,
        )
    except IntegrityError as exc:
        db.rollback()
        raise api_error(409, SIMULATION_RUN_ALREADY_EXISTS) from exc
    return serialize_run(record)


@router.get("/runs")
def list_simulation_runs(
    limit: int = Query(DEFAULT_SIMULATION_RUN_LIST_LIMIT, ge=1, le=MAX_SIMULATION_RUN_LIST_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    records = simulation_run_repository.list_simulation_runs(db, limit=limit, offset=offset)
    simulation_runs = [serialize_run_summary(record) for record in records]
    return {
        "simulationRuns": simulation_runs,
        "pagination": {
            "limit": limit,
            "offset": offset,
            "returned": len(simulation_runs),
        },
    }


@router.get("/runs/{simulation_run_id}")
def get_simulation_run(
    simulation_run_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    record = simulation_run_repository.get_simulation_run(db, simulation_run_id)
    if record is None:
        raise api_error(404, SIMULATION_RUN_NOT_FOUND)
    return serialize_run(record)
