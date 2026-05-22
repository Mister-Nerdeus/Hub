from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

from app.models import PlanRecord


def test_plan_record_uses_phase2_layout_schema() -> None:
    columns = PlanRecord.__table__.columns

    assert "id" in columns
    assert "name" in columns
    assert "description" in columns
    assert "layout_json" in columns
    assert "created_at" in columns
    assert "updated_at" in columns
    assert "payload" not in columns


def test_layout_json_uses_jsonb_for_postgres() -> None:
    layout_type = PlanRecord.__table__.columns["layout_json"].type
    postgres_type = layout_type.dialect_impl(postgresql.dialect())

    assert isinstance(postgres_type, JSONB)
