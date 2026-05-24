from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Response, status
from pydantic import Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.contracts import PLAN_DESCRIPTION_MAX_LENGTH, PlanContract, StrictModel
from app.db import get_db
from app.errors import (
    PLAN_ALREADY_EXISTS,
    PLAN_CONTRACT_INVALID,
    PLAN_ID_MISMATCH,
    PLAN_NOT_FOUND,
    api_error,
)
from app.models import PlanRecord
from app.repositories import plans as plan_repository

router = APIRouter(prefix="/v1/plans", tags=["plans"])


class PlanWriteRequest(StrictModel):
    description: str | None = Field(default=None, max_length=PLAN_DESCRIPTION_MAX_LENGTH)
    layout: PlanContract


def serialize_timestamp(value: datetime) -> str:
    return value.isoformat()


def serialize_plan(record: PlanRecord) -> dict[str, Any]:
    return {
        "id": record.id,
        "name": record.name,
        "description": record.description,
        "layout": record.layout_json,
        "createdAt": serialize_timestamp(record.created_at),
        "updatedAt": serialize_timestamp(record.updated_at),
    }


def serialize_plan_summary(record: PlanRecord) -> dict[str, Any]:
    return {
        "id": record.id,
        "name": record.name,
        "description": record.description,
        "createdAt": serialize_timestamp(record.created_at),
        "updatedAt": serialize_timestamp(record.updated_at),
    }


def canonical_description(request: PlanWriteRequest) -> str | None:
    if "description" in request.model_fields_set and request.description != request.layout.description:
        raise api_error(400, PLAN_CONTRACT_INVALID, "description must match layout.description when provided")
    return request.layout.description


@router.post("", status_code=status.HTTP_201_CREATED)
def create_plan(request: PlanWriteRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    layout_json = request.layout.model_dump(mode="json")
    description = canonical_description(request)
    try:
        record = plan_repository.create_plan(
            db,
            plan_id=request.layout.planId,
            name=request.layout.name,
            description=description,
            layout_json=layout_json,
        )
    except IntegrityError as exc:
        db.rollback()
        raise api_error(409, PLAN_ALREADY_EXISTS) from exc
    return serialize_plan(record)


@router.get("")
def list_plans(db: Session = Depends(get_db)) -> dict[str, Any]:
    records = plan_repository.list_plans(db)
    return {"plans": [serialize_plan_summary(record) for record in records]}


@router.get("/{plan_id}")
def get_plan(plan_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    record = plan_repository.get_plan(db, plan_id)
    if record is None:
        raise api_error(404, PLAN_NOT_FOUND)
    return serialize_plan(record)


@router.put("/{plan_id}")
def update_plan(
    plan_id: str,
    request: PlanWriteRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    if request.layout.planId != plan_id:
        raise api_error(400, PLAN_ID_MISMATCH)

    record = plan_repository.get_plan(db, plan_id)
    if record is None:
        raise api_error(404, PLAN_NOT_FOUND)

    updated = plan_repository.update_plan(
        db,
        record,
        name=request.layout.name,
        description=canonical_description(request),
        layout_json=request.layout.model_dump(mode="json"),
    )
    return serialize_plan(updated)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(plan_id: str, db: Session = Depends(get_db)) -> Response:
    record = plan_repository.get_plan(db, plan_id)
    if record is None:
        raise api_error(404, PLAN_NOT_FOUND)
    plan_repository.delete_plan(db, record)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
