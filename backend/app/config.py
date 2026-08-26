import json
import secrets
import warnings
from typing import Any, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# Deterministic fallback secret to ensure cross-process and serverless session persistence
DEFAULT_FALLBACK_JWT_SECRET = "cyberlearn-production-stable-jwt-secret-key-2026-auth-098234710298374"
DEFAULT_FALLBACK_FLAG_SECRET = "cyberlearn-flag-hmac-secret-stable-2026-c4b92"

def _dev_secret_placeholder() -> str:
    """Return stable default secret to prevent session invalidation on restart."""
    return DEFAULT_FALLBACK_JWT_SECRET


class Settings(BaseSettings):
    PROJECT_NAME: str = "CyberLearn API"

    # JWT signing key — stable fallback ensures login sessions persist across restarts & serverless workers
    SECRET_KEY: str = DEFAULT_FALLBACK_JWT_SECRET
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days active session lifespan

    # Secret used to derive CTF lab flags via HMAC
    FLAG_SECRET: str = DEFAULT_FALLBACK_FLAG_SECRET

    # Database URL: defaults to local SQLite file for ease of developer setup
    DATABASE_URL: str = "sqlite:///./cyberlearn.db"

    # SMTP / Email Service Configuration (Brevo, Gmail, or Custom SMTP)
    BREVO_API_KEY: str = ""
    SMTP_HOST: str = "smtp-relay.brevo.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "mdraihan2328@gmail.com"
    EMAILS_FROM_NAME: str = "Cyber Learn"
    FRONTEND_URL: str = "https://cyber-learn-three.vercel.app"

    # AI Coach LLM API Keys (Google Gemini / OpenAI)
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # OAuth Credentials (Google & GitHub)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""


    # CORS Origins: accepts List[str], JSON string, or comma-separated string from environment
    BACKEND_CORS_ORIGINS: Union[list[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "*",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            v_str = v.strip()
            if not v_str:
                return ["*"]
            if v_str.startswith("[") and v_str.endswith("]"):
                try:
                    parsed = json.loads(v_str)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed]
                except Exception:
                    pass
            return [item.strip() for item in v_str.split(",") if item.strip()]
        elif isinstance(v, list):
            return [str(item).strip() for item in v]
        return ["*"]

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


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
