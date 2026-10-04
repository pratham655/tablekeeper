from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.core.token import create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.services.transaction import transaction


class UserAlreadyExistsError(ValueError):
    """Raised when a user with the email already exists."""


class InvalidCredentialsError(ValueError):
    """Raised when login credentials are invalid or the account is inactive."""


def register_user(db: Session, user_data: UserCreate) -> User:
    email = str(user_data.email).strip().lower()

    existing_user = db.scalar(
        select(User).where(User.email == email)
    )
    if existing_user is not None:
        raise UserAlreadyExistsError(
            "An account with this email already exists"
        )

    user = User(
        full_name=user_data.full_name.strip(),
        email=email,
        password_hash=hash_password(user_data.password),
        role="customer",
        is_active=True,
    )

    with transaction(db):
        db.add(user)
        db.flush()

    db.refresh(user)
    return user


def login_user(db: Session, login_data: UserLogin) -> tuple[User, str]:
    email = str(login_data.email).strip().lower()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    if user is None:
        raise InvalidCredentialsError("Invalid email or password")

    if not verify_password(login_data.password, user.password_hash):
        raise InvalidCredentialsError("Invalid email or password")

    if not user.is_active:
        raise InvalidCredentialsError("Invalid email or password")

    access_token = create_access_token(
        subject=str(user.id),
        role=user.role,
    )

    return user, access_token
