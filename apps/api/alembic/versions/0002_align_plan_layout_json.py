"""Align plan table to layout_json persistence.

Revision ID: 0002_align_plan_layout_json
Revises: 0001_base
Create Date: 2026-05-22
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_align_plan_layout_json"
down_revision = "0001_base"
branch_labels = None
depends_on = None


def layout_json_type() -> sa.types.TypeEngine:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return postgresql.JSONB()
    return sa.JSON()


def upgrade() -> None:
    json_type = layout_json_type()
    op.add_column("plans", sa.Column("description", sa.String(length=500), nullable=True))
    op.add_column("plans", sa.Column("layout_json", json_type, nullable=True))
    op.execute("UPDATE plans SET layout_json = payload")

    with op.batch_alter_table("plans") as batch_op:
        batch_op.alter_column("layout_json", existing_type=json_type, nullable=False)
        batch_op.drop_column("payload")


def downgrade() -> None:
    json_type = layout_json_type()
    op.add_column("plans", sa.Column("payload", json_type, nullable=True))
    op.execute("UPDATE plans SET payload = layout_json")

    with op.batch_alter_table("plans") as batch_op:
        batch_op.alter_column("payload", existing_type=json_type, nullable=False)
        batch_op.drop_column("layout_json")
        batch_op.drop_column("description")
