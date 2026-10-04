
from contextlib import contextmanager
from typing import Iterator

from sqlalchemy.orm import Session


@contextmanager
def transaction(db: Session) -> Iterator[Session]:
    """
    Manage a database transaction.

    Commit when the operation succeeds.
    Roll back and re-raise if an exception occurs.
    """
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise