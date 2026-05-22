from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import PlanRecord


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_plan(
    db: Session,
    *,
    plan_id: str,
    name: str,
    description: str | None,
    layout_json: dict,
) -> PlanRecord:
    record = PlanRecord(
        id=plan_id,
        name=name,
        description=description,
        layout_json=layout_json,
        created_at=utc_now(),
        updated_at=utc_now(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_plans(db: Session) -> list[PlanRecord]:
    return list(db.scalars(select(PlanRecord).order_by(PlanRecord.created_at, PlanRecord.id)).all())


def get_plan(db: Session, plan_id: str) -> PlanRecord | None:
    return db.get(PlanRecord, plan_id)


def update_plan(
    db: Session,
    record: PlanRecord,
    *,
    name: str,
    description: str | None,
    layout_json: dict,
) -> PlanRecord:
    record.name = name
    record.description = description
    record.layout_json = layout_json
    record.updated_at = utc_now()
    db.commit()
    db.refresh(record)
    return record


def delete_plan(db: Session, record: PlanRecord) -> None:
    db.delete(record)
    db.commit()
