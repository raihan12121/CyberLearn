from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from ..database import get_db
from ..config import settings
from .. import models, schemas

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """
    Extract current authenticated user if valid Bearer token is provided,
    otherwise returns None without throwing HTTP 401 exceptions.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1].strip()
    if not token or token in ("null", "undefined", ""):
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return db.query(models.User).filter(models.User.email == email).first()
    except Exception:
        return None


def has_active_subscription(user: Optional[models.User]) -> bool:
    """
    Determines whether a user has active subscription access to courses and practice labs.
    Staff roles (admin, instructor) and active paid members (pro_member, premium_member, or
    subscription_status == 'active') have access.
    """
    if not user:
        return False

    # Staff have full access
    if user.role in ["admin", "instructor"]:
        return True

    # Check paid member roles
    if user.role in ["pro_member", "premium_member"]:
        return True

    # Check explicit subscription status
    if getattr(user, "subscription_status", None) == "active":
        expires_at = getattr(user, "subscription_expires_at", None)
        if expires_at is not None:
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            # Normalize naive/aware datetime
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < now:
                return False
        return True

    return False


def require_subscription(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """
    FastAPI dependency that enforces an active paid subscription for sensitive endpoints.
    Raises HTTP 403 Forbidden with a clear message and pricing redirect recommendation if unpaid.
    """
    if not has_active_subscription(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Subscription required: An active Pro or Premium subscription is required to use courses and labs. Please upgrade your plan at /pricing."
        )
    return current_user


