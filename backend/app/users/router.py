from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List, Dict, Any
from ..database import get_db
from .. import models, schemas
from ..auth.dependencies import get_current_user
from ..auth.utils import get_password_hash, verify_password

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/me/profile")
def get_user_profile_details(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Calculate global rank
    # Rank is the position of current_user in users list sorted by XP descending
    users_sorted = db.query(models.User).order_by(models.User.xp.desc()).all()
    rank = 1
    for idx, u in enumerate(users_sorted):
        if u.id == current_user.id:
            rank = idx + 1
            break
            
    # Calculate solved labs count
    solved_labs_count = db.query(models.LabSession).filter(
        models.LabSession.user_id == current_user.id,
        models.LabSession.status == "completed"
    ).count()
    
    # Auto-award achievements based on stats if not already earned
    earned_badges = {a.badge_name for a in current_user.achievements}
    
    milestones = [
        {"badge": "First Blood", "icon": "🎯", "desc": "Earned your first XP points on CyberLearn.", "condition": current_user.xp > 0},
        {"badge": "Web Wizard", "icon": "🧙", "desc": "Successfully completed a web security sandbox lab.", "condition": solved_labs_count >= 1},
        {"badge": "50 Labs Master", "icon": "🏆", "desc": "Demonstrated relentless practice across labs.", "condition": solved_labs_count >= 3},
        {"badge": "Top 10% Rank", "icon": "⭐", "desc": "Ranked among global active learners.", "condition": rank <= max(1, len(users_sorted) // 10)},
    ]
    
    new_achievements = False
    for m in milestones:
        if m["condition"] and m["badge"] not in earned_badges:
            new_achievement = models.Achievement(
                user_id=current_user.id,
                badge_name=m["badge"],
                badge_icon=m["icon"]
            )
            db.add(new_achievement)
            current_user.xp += 50
            new_achievements = True
            
    if new_achievements:
        db.commit()
        db.refresh(current_user)

    # Compute Skillsets based on lab category completion
    categories = [
        {"name": "Web Security", "db_types": ["Web Security", "Web"]},
        {"name": "Linux Administration", "db_types": ["Linux basics", "Linux", "Privilege Escalation"]},
        {"name": "Network Defense", "db_types": ["Networking", "Network"]},
        {"name": "Cryptography", "db_types": ["Crypto"]},
        {"name": "AI Safety", "db_types": ["AI Security", "AI"]},
    ]
    
    skill_stats = []
    for cat in categories:
        total_labs = db.query(models.Lab).filter(models.Lab.type.in_(cat["db_types"])).count()
        if total_labs == 0:
            # Fallback so skills aren't completely empty for unseeded categories
            val = 20 if "AI" in cat["name"] else 40
        else:
            completed_labs = db.query(models.LabSession).join(models.Lab).filter(
                models.LabSession.user_id == current_user.id,
                models.LabSession.status == "completed",
                models.Lab.type.in_(cat["db_types"])
            ).count()
            val = int((completed_labs / total_labs) * 100)
            # Add a base percentage if they completed at least one lab to make it look active
            if completed_labs > 0 and val < 30:
                val = 30
        skill_stats.append({
            "name": cat["name"],
            "value": max(val, 10 if solved_labs_count > 0 else 0)  # show some initial progression if they solved anything
        })
        
    # Get Achievements
    achievements = []
    # If achievements table has entries, map them
    for a in current_user.achievements:
        # Match with description
        desc = "Completed sandbox practice badge."
        for m in milestones:
            if m["badge"] == a.badge_name:
                desc = m["desc"]
                break
        achievements.append({
            "name": a.badge_name,
            "icon": a.badge_icon or "🏅",
            "date": a.earned_at.strftime("%B %d, %Y"),
            "desc": desc
        })
        
    # If achievements list is empty (e.g. no XP yet), provide a couple of placeholders
    if not achievements:
        achievements = [
            {
                "name": "First Step",
                "icon": "🚀",
                "date": current_user.created_at.strftime("%B %d, %Y"),
                "desc": "Created your CyberLearn academy learning account."
            }
        ]

    # Build Activity Timeline
    timeline = []
    
    # 1. Completed labs
    completed_sessions = db.query(models.LabSession).filter(
        models.LabSession.user_id == current_user.id,
        models.LabSession.status == "completed"
    ).all()
    for s in completed_sessions:
        lab = db.query(models.Lab).filter(models.Lab.id == s.lab_id).first()
        lab_title = lab.title if lab else "Sandbox Lab"
        xp_gain = lab.xp_reward if lab else 100
        timeline.append({
            "action": f"Completed {lab_title} Lab",
            "xp": f"+{xp_gain} XP",
            "date": s.completed_at.strftime("%B %d, %Y, %I:%M %p") if s.completed_at else s.started_at.strftime("%B %d, %Y, %I:%M %p"),
            "timestamp": s.completed_at or s.started_at
        })
        
    # 2. Completed lessons
    completed_progress = db.query(models.Progress).filter(
        models.Progress.user_id == current_user.id,
        models.Progress.status == "completed"
    ).all()
    for p in completed_progress:
        lesson = db.query(models.Lesson).filter(models.Lesson.id == p.lesson_id).first()
        lesson_title = lesson.title if lesson else "Academy Lesson"
        timeline.append({
            "action": f"Completed lesson: {lesson_title}",
            "xp": "+50 XP",
            "date": p.updated_at.strftime("%B %d, %Y, %I:%M %p"),
            "timestamp": p.updated_at
        })
        
    # 3. Earned Achievements
    for a in current_user.achievements:
        timeline.append({
            "action": f"Earned '{a.badge_name}' Achievement Badge",
            "xp": "+50 XP",
            "date": a.earned_at.strftime("%B %d, %Y, %I:%M %p"),
            "timestamp": a.earned_at
        })
        
    # Sort timeline by timestamp desc
    timeline.sort(key=lambda x: x["timestamp"], reverse=True)
    # Strip internal timestamp before sending
    for t in timeline:
        del t["timestamp"]
        
    # Default activity if nothing completed yet
    if not timeline:
        timeline = [{
            "action": "Successfully set up CyberLearn profile credentials",
            "xp": "",
            "date": current_user.created_at.strftime("%B %d, %Y, %I:%M %p")
        }]

    # Format joined date
    joined_date = current_user.created_at.strftime("Joined %B %Y")

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "username": current_user.username or current_user.email.split("@")[0],
        "avatar_url": current_user.avatar_url,
        "xp": current_user.xp,
        "streak_days": current_user.streak_days,
        "rank": rank,
        "solved_labs_count": solved_labs_count,
        "joined_date": joined_date,
        "role": current_user.role,
        "skill_stats": skill_stats,
        "achievements": timeline[:5], # we return activities under timeline on the frontend, let's match keys below
        "timeline": timeline[:5],
        "badges": achievements
    }

@router.put("/me", response_model=schemas.UserResponse)
def update_profile(
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if user_update.email is not None and user_update.email != current_user.email:
        # Check if email is already taken
        exists = db.query(models.User).filter(models.User.email == user_update.email).first()
        if exists:
            raise HTTPException(status_code=400, detail="A user with this email already exists.")
        current_user.email = user_update.email
        
    if user_update.username is not None and user_update.username != current_user.username:
        # Check if username is already taken
        exists = db.query(models.User).filter(models.User.username == user_update.username).first()
        if exists:
            raise HTTPException(status_code=400, detail="Username is already taken.")
        current_user.username = user_update.username
        
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
        
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/password")
def change_password(
    password_in: schemas.PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify current password
    # Exclude social logins which don't have password
    if current_user.password_hash == "social_login_no_password":
        raise HTTPException(status_code=400, detail="Social login accounts do not have a standard password configuration.")
        
    if not verify_password(password_in.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password.")
        
    current_user.password_hash = get_password_hash(password_in.new_password)
    db.commit()
    return {"detail": "Password updated successfully."}
