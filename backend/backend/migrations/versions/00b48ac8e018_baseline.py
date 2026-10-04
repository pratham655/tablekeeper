"""Initial baseline migration for Tablekeeper."""

from typing import Sequence, Union

from alembic import op

from app.core.database import Base
import app.models

revision: str = "00b48ac8e018"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
