import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CyberLearn API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_cyber_learn_token_key_1337_!")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # Database URL: defaults to local SQLite file for ease of developer setup
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cyberlearn.db")
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    class Config:
        case_sensitive = True

settings = Settings()
