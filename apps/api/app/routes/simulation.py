from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import SimulationRunRecord
from app.repositories import simulation_runs as simulation_run_repository
from app.schemas.simulation import SimulationRunContract, validate_persisted_simulation_run

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
            detail="persisted simulation run failed validation",
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
    simulation_run = validated_simulation_json(record)
    return {
        "id": record.id,
        "simulationRunId": simulation_run["simulationRunId"],
        "scenarioId": simulation_run["scenarioId"],
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
    payload = simulation_run.model_dump(mode="json")
    try:
        record = simulation_run_repository.create_simulation_run(
            db,
            simulation_run_id=simulation_run.simulationRunId,
            simulation_json=payload,
        )
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="simulation run already exists") from exc
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
        raise HTTPException(status_code=404, detail="simulation run not found")
    return serialize_run(record)
