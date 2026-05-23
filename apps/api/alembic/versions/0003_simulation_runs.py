"""Add simulation run persistence.

Revision ID: 0003_simulation_runs
Revises: 0002_align_plan_layout_json
Create Date: 2026-05-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003_simulation_runs"
down_revision = "0002_align_plan_layout_json"
branch_labels = None
depends_on = None


def simulation_json_type() -> sa.types.TypeEngine:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return postgresql.JSONB()
    return sa.JSON()


def upgrade() -> None:
    op.create_table(
        "simulation_runs",
        sa.Column("id", sa.String(length=96), primary_key=True),
        sa.Column("simulation_json", simulation_json_type(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("simulation_runs")
