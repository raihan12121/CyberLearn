from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt
import bcrypt
from ..config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # bcrypt expects bytes
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        print("Error verifying password:", e)
        return False

def get_password_hash(password: str) -> str:
    password_bytes = password.encode('utf-8')
    # Use gensalt with 12 rounds (standard bcrypt cost factor)
    salt = bcrypt.gensalt(12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
