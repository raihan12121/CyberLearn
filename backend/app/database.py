import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL or "sqlite:///./cyberlearn.db"

# Convert legacy postgres:// to postgresql:// for SQLAlchemy 2.0+
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Check if placeholder example database URL is used
if "ep-xyz-123.neon.tech" in db_url or "username:password" in db_url:
    logger.warning("Placeholder DATABASE_URL detected. Falling back to local SQLite database.")
    db_url = "sqlite:///./cyberlearn.db"

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(db_url, connect_args=connect_args)
    # Validate connection
    with engine.connect() as conn:
        pass
except Exception as e:
    logger.error(f"Failed to connect to database at '{db_url}': {e}. Falling back to SQLite.")
    db_url = "sqlite:///./cyberlearn.db"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get db session in API router parameters
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
