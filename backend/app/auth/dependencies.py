import os
from typing import Optional
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """
    FastAPI dependency that extracts and validates the JWT Bearer token,
    returning the matching User record from the database.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )
    return user


def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """
    Optional authentication dependency. Returns the User model if a valid token is provided,
    otherwise returns None without raising an HTTP error.
    """
    if not token:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            return None
        return db.query(models.User).filter(models.User.email == email).first()
    except Exception:
        return None


def has_active_subscription(user: Optional[models.User]) -> bool:
    """
    Determines whether a user has an active paid subscription to courses and labs.
    Staff roles (admin, instructor) and active paid members (pro_member, premium_member, or
    subscription_status == 'active' with a valid future expiration date) have access.
    Free tier / inactive users do NOT have subscription access and must subscribe.
    """
    if not user:
        return False

    # Staff have full access
    if user.role in ["admin", "instructor"]:
        return True

    # Check paid member roles
    if user.role in ["pro_member", "premium_member"]:
        return True

    # Check explicit subscription status and expiration timestamp
    if getattr(user, "subscription_status", None) == "active":
        expires_at = getattr(user, "subscription_expires_at", None)
        if expires_at is not None:
            now = datetime.now(timezone.utc)
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


def has_course_access(user: Optional[models.User], course_id: str, db: Session) -> bool:
    """
    Checks if a user has access to a specific course either via:
    1. Staff role (admin, instructor)
    2. Active All-Access Pro/Premium subscription
    3. Individual lifetime course purchase (CoursePurchase)
    """
    if not user:
        return False
    if has_active_subscription(user):
        return True
        
    purchase = db.query(models.CoursePurchase).filter(
        models.CoursePurchase.user_id == user.id,
        models.CoursePurchase.course_id == course_id
    ).first()
    return purchase is not None
