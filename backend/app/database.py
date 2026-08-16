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

def run_auto_migrations(engine):
    """
    Safely adds newly introduced columns to existing SQLite tables if they do not already exist.
    """
    from sqlalchemy import text
    with engine.connect() as conn:
        # Check users table columns
        try:
            res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            existing_cols = {row[1] for row in res}
            
            new_user_cols = [
                ("nid_number", "VARCHAR(50)"),
                ("nid_front_image", "TEXT"),
                ("nid_back_image", "TEXT"),
                ("verification_status", "VARCHAR(20) DEFAULT 'unverified'"),
                ("verification_notes", "TEXT"),
                ("verified_at", "DATETIME")
            ]
            for col_name, col_type in new_user_cols:
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                    
            # Check certificates table columns
            res_cert = conn.execute(text("PRAGMA table_info(certificates)")).fetchall()
            existing_cert_cols = {row[1] for row in res_cert}
            new_cert_cols = [
                ("exam_id", "VARCHAR(36)"),
                ("score_pct", "NUMERIC(5, 2)"),
                ("certificate_type", "VARCHAR(50) DEFAULT 'course_completion'")
            ]
            for col_name, col_type in new_cert_cols:
                if col_name not in existing_cert_cols:
                    conn.execute(text(f"ALTER TABLE certificates ADD COLUMN {col_name} {col_type}"))

            conn.commit()
        except Exception as e:
            logger.warning(f"Auto-migration notice: {e}")

# Dependency to get db session in API router parameters
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

