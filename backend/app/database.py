import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

import os

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL or "sqlite:///./cyberlearn.db"

# Convert legacy postgres:// to postgresql:// for SQLAlchemy 2.0+
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Check if placeholder example database URL is used
if "ep-xyz-123.neon.tech" in db_url or "username:password" in db_url:
    logger.warning("Placeholder DATABASE_URL detected. Falling back to local SQLite database.")
    db_url = "sqlite:///./cyberlearn.db"

# If SQLite relative path is used, resolve to deterministic absolute backend path
if db_url.startswith("sqlite:///./") or db_url == "sqlite:///cyberlearn.db":
    backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sqlite_abs_path = os.path.join(backend_root, "cyberlearn.db").replace("\\", "/")
    db_url = f"sqlite:///{sqlite_abs_path}"

engine_kwargs = {}
if db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production PostgreSQL connection pool settings for cloud databases (Neon, Supabase, Render Postgres)
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 5

try:
    engine = create_engine(db_url, **engine_kwargs)
    with engine.connect() as conn:
        pass
except Exception as e:
    logger.error(f"Failed to connect to database at '{db_url}': {e}. Falling back to SQLite.")
    backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sqlite_abs_path = os.path.join(backend_root, "cyberlearn.db").replace("\\", "/")
    db_url = f"sqlite:///{sqlite_abs_path}"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def run_auto_migrations(engine):
    """
    Safely adds newly introduced columns to existing database tables if they do not already exist.
    Supports both SQLite and PostgreSQL dialects without breaking DDL syntax.
    """
    dialect = engine.dialect.name
    with engine.connect() as conn:
        try:
            if dialect == "sqlite":
                # Check users table columns in SQLite
                res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                existing_user_cols = {row[1] for row in res}
                
                new_user_cols = [
                    ("nid_number", "VARCHAR(50)"),
                    ("nid_front_image", "TEXT"),
                    ("nid_back_image", "TEXT"),
                    ("verification_status", "VARCHAR(20) DEFAULT 'unverified'"),
                    ("verification_notes", "TEXT"),
                    ("verified_at", "DATETIME"),
                    ("verification_code", "VARCHAR(10)"),
                    ("verification_code_expires_at", "DATETIME"),
                    ("subscription_tier", "VARCHAR(50) DEFAULT 'free'"),
                    ("subscription_status", "VARCHAR(20) DEFAULT 'inactive'"),
                    ("subscription_expires_at", "DATETIME"),
                    ("is_onboarded", "BOOLEAN DEFAULT 0"),
                    ("bio", "TEXT"),
                    ("primary_focus", "VARCHAR(100)"),
                    ("experience_level", "VARCHAR(50)")
                ]
                for col_name, col_type in new_user_cols:
                    if col_name not in existing_user_cols:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                conn.execute(text("UPDATE users SET is_onboarded = 1 WHERE is_onboarded IS NULL OR is_onboarded = 0"))
                conn.commit()

                # Check certificates table columns in SQLite
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

                # Check if certificates course_id has notnull=1
                cert_course_col = next((row for row in res_cert if row[1] == "course_id"), None)
                if cert_course_col and cert_course_col[3] == 1:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS certificates_new (
                            id VARCHAR(36) NOT NULL PRIMARY KEY,
                            user_id VARCHAR(36) NOT NULL,
                            course_id VARCHAR(36),
                            exam_id VARCHAR(36),
                            score_pct NUMERIC(5, 2),
                            certificate_type VARCHAR(50) DEFAULT 'course_completion',
                            verification_token VARCHAR(100) NOT NULL UNIQUE,
                            issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE,
                            FOREIGN KEY(course_id) REFERENCES courses (id) ON DELETE SET NULL,
                            FOREIGN KEY(exam_id) REFERENCES exams (id) ON DELETE SET NULL
                        )
                    """))
                    conn.execute(text("INSERT OR IGNORE INTO certificates_new SELECT id, user_id, course_id, exam_id, score_pct, certificate_type, verification_token, issued_at FROM certificates"))
                    conn.execute(text("DROP TABLE certificates"))
                    conn.execute(text("ALTER TABLE certificates_new RENAME TO certificates"))

                # Check courses table columns in SQLite
                res_course = conn.execute(text("PRAGMA table_info(courses)")).fetchall()
                existing_course_cols = {row[1] for row in res_course}
                if "price" not in existing_course_cols:
                    conn.execute(text("ALTER TABLE courses ADD COLUMN price NUMERIC(10, 2) DEFAULT 49.00"))

                # Check invoices table columns in SQLite
                res_inv = conn.execute(text("PRAGMA table_info(invoices)")).fetchall()
                existing_inv_cols = {row[1] for row in res_inv}
                if "purchase_type" not in existing_inv_cols:
                    conn.execute(text("ALTER TABLE invoices ADD COLUMN purchase_type VARCHAR(50) DEFAULT 'subscription'"))
                if "course_id" not in existing_inv_cols:
                    conn.execute(text("ALTER TABLE invoices ADD COLUMN course_id VARCHAR(36)"))

                # Check posts table columns in SQLite
                res_posts = conn.execute(text("PRAGMA table_info(posts)")).fetchall()
                existing_post_cols = {row[1] for row in res_posts}
                if "tags" not in existing_post_cols:
                    conn.execute(text("ALTER TABLE posts ADD COLUMN tags VARCHAR(255)"))
                if "is_solved" not in existing_post_cols:
                    conn.execute(text("ALTER TABLE posts ADD COLUMN is_solved BOOLEAN DEFAULT 0"))

                # Check exams table columns in SQLite
                exam_info = conn.execute(text("PRAGMA table_info(exams)")).fetchall()
                course_id_col = next((row for row in exam_info if row[1] == "course_id"), None)
                if course_id_col and course_id_col[3] == 1:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS exams_new (
                            id VARCHAR(36) NOT NULL PRIMARY KEY,
                            course_id VARCHAR(36),
                            title VARCHAR(255) NOT NULL,
                            description TEXT,
                            duration_minutes INTEGER,
                            passing_score_pct INTEGER,
                            total_marks INTEGER,
                            is_published BOOLEAN,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY(course_id) REFERENCES courses (id)
                        )
                    """))
                    conn.execute(text("INSERT OR IGNORE INTO exams_new SELECT id, course_id, title, description, duration_minutes, passing_score_pct, total_marks, is_published, created_at FROM exams"))
                    conn.execute(text("DROP TABLE exams"))
                    conn.execute(text("ALTER TABLE exams_new RENAME TO exams"))

                conn.commit()

            elif dialect == "postgresql":
                # Check users table in PostgreSQL
                res = conn.execute(text(
                    "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
                )).fetchall()
                existing_user_cols = {row[0] for row in res}

                new_user_cols = [
                    ("nid_number", "VARCHAR(50)"),
                    ("nid_front_image", "TEXT"),
                    ("nid_back_image", "TEXT"),
                    ("verification_status", "VARCHAR(20) DEFAULT 'unverified'"),
                    ("verification_notes", "TEXT"),
                    ("verified_at", "TIMESTAMPTZ"),
                    ("verification_code", "VARCHAR(10)"),
                    ("verification_code_expires_at", "TIMESTAMPTZ"),
                    ("subscription_tier", "VARCHAR(50) DEFAULT 'free'"),
                    ("subscription_status", "VARCHAR(20) DEFAULT 'inactive'"),
                    ("subscription_expires_at", "TIMESTAMPTZ"),
                    ("is_onboarded", "BOOLEAN DEFAULT TRUE"),
                    ("bio", "TEXT"),
                    ("primary_focus", "VARCHAR(100)"),
                    ("experience_level", "VARCHAR(50)")
                ]
                for col_name, col_type in new_user_cols:
                    if col_name not in existing_user_cols:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                conn.commit()

                # Check certificates table in PostgreSQL
                res_cert = conn.execute(text(
                    "SELECT column_name FROM information_schema.columns WHERE table_name = 'certificates'"
                )).fetchall()
                existing_cert_cols = {row[0] for row in res_cert}
                new_cert_cols = [
                    ("exam_id", "VARCHAR(36)"),
                    ("score_pct", "NUMERIC(5, 2)"),
                    ("certificate_type", "VARCHAR(50) DEFAULT 'course_completion'")
                ]
                for col_name, col_type in new_cert_cols:
                    if col_name not in existing_cert_cols:
                        conn.execute(text(f"ALTER TABLE certificates ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))

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


