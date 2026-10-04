
import os
from pathlib import Path
import re
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Look for .env in current directory or backend directory
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured in .env")

def _sanitize_db_url(url: str) -> str:
    pattern = r"^(?P<prefix>[a-zA-Z0-9+_-]+://)(?P<user>[^:]+):(?P<password>.+)@(?P<host>[^@/:]+)(?P<port>:\d+)?(?P<rest>/.*)?$"
    m = re.match(pattern, url)
    if m:
        pwd = m.group("password")
        safe_pwd = quote_plus(pwd) if "%" not in pwd or "@" in pwd else pwd
        return f"{m.group('prefix')}{m.group('user')}:{safe_pwd}@{m.group('host')}{m.group('port') or ''}{m.group('rest') or ''}"
    return url

SAFE_DATABASE_URL = _sanitize_db_url(DATABASE_URL)

engine = create_engine(
    SAFE_DATABASE_URL,
    pool_pre_ping=True,
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()