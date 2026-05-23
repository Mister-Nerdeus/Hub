from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import SimulationRunRecord


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_simulation_run(
    db: Session,
    *,
    simulation_run_id: str,
    simulation_json: dict,
) -> SimulationRunRecord:
    now = utc_now()
    record = SimulationRunRecord(
        id=simulation_run_id,
        simulation_json=simulation_json,
        created_at=now,
        updated_at=now,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_simulation_runs(db: Session) -> list[SimulationRunRecord]:
    return list(
        db.scalars(
            select(SimulationRunRecord).order_by(
                SimulationRunRecord.created_at,
                SimulationRunRecord.id,
            )
        ).all()
    )


def get_simulation_run(db: Session, simulation_run_id: str) -> SimulationRunRecord | None:
    return db.get(SimulationRunRecord, simulation_run_id)
