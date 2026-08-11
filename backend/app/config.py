import secrets
import warnings
from pydantic_settings import BaseSettings


def _dev_secret_placeholder() -> str:
    """Generate a random secret for development sessions only."""
    return secrets.token_urlsafe(32)


class Settings(BaseSettings):
    PROJECT_NAME: str = "CyberLearn API"

    # JWT signing key — MUST be set via .env or environment for production.
    # If not set, a random key is generated per process (sessions won't persist across restarts).
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Secret used to derive CTF lab flags via HMAC.
    # If not set, a random key is generated per process (flags change on restart).
    FLAG_SECRET: str = ""

    # Database URL: defaults to local SQLite file for ease of developer setup
    DATABASE_URL: str = "sqlite:///./cyberlearn.db"

    # CORS Origins
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "*",
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Warn and auto-generate if secrets are missing (dev convenience, not for production)
if not settings.SECRET_KEY:
    settings.SECRET_KEY = _dev_secret_placeholder()
    warnings.warn(
        "⚠️  SECRET_KEY is not set! Generated a random key for this session. "
        "User sessions will NOT persist across server restarts. "
        "Set SECRET_KEY in your .env file or environment variables for production.",
        stacklevel=1,
    )

if not settings.FLAG_SECRET:
    settings.FLAG_SECRET = _dev_secret_placeholder()
    warnings.warn(
        "⚠️  FLAG_SECRET is not set! Generated a random key for this session. "
        "CTF lab flags will CHANGE on every server restart. "
        "Set FLAG_SECRET in your .env file or environment variables for consistent flags.",
        stacklevel=1,
    )
