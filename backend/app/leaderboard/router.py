import time
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from ..database import get_db
from .. import models
from ..auth.dependencies import get_current_user
from ..auth.utils import create_access_token, get_password_hash
from jose import JWTError, jwt
from ..config import settings
from sqlalchemy import func

router = APIRouter(
    prefix="/leaderboard",
    tags=["Leaderboard"]
)

# Zero-cost in-memory TTL cache for the top leaderboard
_leaderboard_cache: Dict[str, Any] = {
    "data": None,
    "timestamp": 0
}
LEADERBOARD_CACHE_TTL = 30  # 30 seconds

def get_optional_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[models.User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        user = db.query(models.User).filter(models.User.email == email).first()
        return user
    except Exception:
        return None

@router.get("")
def get_leaderboard(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    now = time.time()
    
    # Check in-memory cache
    if _leaderboard_cache["data"] is not None and (now - _leaderboard_cache["timestamp"] < LEADERBOARD_CACHE_TTL):
        base_entries = _leaderboard_cache["data"]
        # Customize "current" flag per requesting user
        result = []
        for entry in base_entries:
            e = dict(entry)
            e["current"] = True if current_user and e.get("user_id") == current_user.id else False
            result.append(e)
        return result

    # Pre-seed some mock active competitors if db is essentially empty
    user_count = db.query(models.User).count()
    if user_count <= 1:
        mock_competitors = [
            ("AlexHacker", 45230, 45),
            ("SecureSam", 42100, 38),
            ("CyberNinja", 39850, 52),
            ("NetSlayer", 35120, 28),
            ("BitShift", 32400, 21),
            ("FirewallFighter", 11800, 12),
            ("CookieMonster", 9500, 10),
        ]
        new_users = []
        for username, xp, streak in mock_competitors:
            comp = models.User(
                email=f"{username.lower()}@cyberlearn.io",
                username=username,
                password_hash=get_password_hash("mocked_competitor_pass_123"),
                full_name=username,
                xp=xp,
                streak_days=streak,
                role="student"
            )
            new_users.append(comp)
        db.add_all(new_users)
        db.commit()

    # Retrieve top users sorted by XP desc (indexed)
    users = db.query(models.User).order_by(models.User.xp.desc()).limit(max(1, min(limit, 200))).all()
    user_ids = [u.id for u in users]

    # Bounded query for solved labs count grouped only by the top users (prevents full-table scan)
    solved_counts = {}
    if user_ids:
        solved_counts = dict(
            db.query(
                models.LabSession.user_id,
                func.count(models.LabSession.id)
            ).filter(
                models.LabSession.user_id.in_(user_ids),
                models.LabSession.status == "completed"
            ).group_by(models.LabSession.user_id).all()
        )

    base_entries = []
    for idx, u in enumerate(users):
        solved_count = solved_counts.get(u.id, 0)
        
        # Fallback baseline solved count for seeded demo competitors
        if solved_count == 0 and u.email and u.email.endswith("@cyberlearn.io"):
            mock_solved_map = {
                "AlexHacker": 154, "SecureSam": 142, "CyberNinja": 135,
                "NetSlayer": 110, "BitShift": 98, "FirewallFighter": 38, "CookieMonster": 30
            }
            solved_count = mock_solved_map.get(u.username, 0)

        base_entries.append({
            "rank": idx + 1,
            "user_id": u.id,
            "name": u.full_name or u.username or u.email.split("@")[0],
            "xp": u.xp,
            "solved": solved_count,
            "activeDays": u.streak_days,
            "current": False
        })

    # Cache calculated top entries
    _leaderboard_cache["data"] = base_entries
    _leaderboard_cache["timestamp"] = now

    # Customize "current" flag for the response
    response_entries = []
    for entry in base_entries:
        e = dict(entry)
        e["current"] = True if current_user and e.get("user_id") == current_user.id else False
        response_entries.append(e)
        
    return response_entries

