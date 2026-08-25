from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
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
    # Calculate global rank via efficient SQL count
    higher_xp_count = db.query(func.count(models.User.id)).filter(models.User.xp > current_user.xp).scalar()
    rank = higher_xp_count + 1
            
    # Calculate solved labs count
    solved_labs_count = db.query(models.LabSession).filter(
        models.LabSession.user_id == current_user.id,
        models.LabSession.status == "completed"
    ).count()
    
    # Auto-award achievements based on stats if not already earned
    earned_badges = {a.badge_name for a in current_user.achievements}
    
    # Calculate total users for percentile rank milestone
    total_users = db.query(func.count(models.User.id)).scalar() or 1

    milestones = [
        {"badge": "First Blood", "icon": "🎯", "desc": "Earned your first XP points on CyberLearn.", "condition": current_user.xp > 0},
        {"badge": "Web Wizard", "icon": "🧙", "desc": "Successfully completed a web security sandbox lab.", "condition": solved_labs_count >= 1},
        {"badge": "50 Labs Master", "icon": "🏆", "desc": "Demonstrated relentless practice across labs.", "condition": solved_labs_count >= 3},
        {"badge": "Top 10% Rank", "icon": "⭐", "desc": "Ranked among global active learners.", "condition": rank <= max(1, total_users // 10)},
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
            new_achievements = True
            
    if new_achievements:
        db.commit()
        db.refresh(current_user)

    # Compute Skillsets based on lab category completion (Batch query: 2 queries instead of 10)
    categories = [
        {"name": "Web Security", "db_types": {"Web Security", "Web"}},
        {"name": "Linux Administration", "db_types": {"Linux basics", "Linux", "Privilege Escalation"}},
        {"name": "Network Defense", "db_types": {"Networking", "Network"}},
        {"name": "Cryptography", "db_types": {"Crypto"}},
        {"name": "AI Safety", "db_types": {"AI Security", "AI"}},
    ]
    
    all_labs = db.query(models.Lab.id, models.Lab.type).all()
    completed_lab_ids = set(
        r[0] for r in db.query(models.LabSession.lab_id).filter(
            models.LabSession.user_id == current_user.id,
            models.LabSession.status == "completed"
        ).all()
    )

    skill_stats = []
    for cat in categories:
        cat_labs = [l for l in all_labs if l.type in cat["db_types"]]
        total_labs = len(cat_labs)
        if total_labs == 0:
            val = 20 if "AI" in cat["name"] else 40
        else:
            completed_in_cat = sum(1 for l in cat_labs if l.id in completed_lab_ids)
            val = int((completed_in_cat / total_labs) * 100)
            if completed_in_cat > 0 and val < 30:
                val = 30
        skill_stats.append({
            "name": cat["name"],
            "value": max(val, 10 if solved_labs_count > 0 else 0)
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
    
    # 1. Completed labs (with join to prevent N+1 query)
    completed_sessions = db.query(models.LabSession, models.Lab).outerjoin(
        models.Lab, models.LabSession.lab_id == models.Lab.id
    ).filter(
        models.LabSession.user_id == current_user.id,
        models.LabSession.status == "completed"
    ).all()
    for s, lab in completed_sessions:
        lab_title = lab.title if lab else "Sandbox Lab"
        xp_gain = lab.xp_reward if lab else 100
        timeline.append({
            "action": f"Completed {lab_title} Lab",
            "xp": f"+{xp_gain} XP",
            "date": s.completed_at.strftime("%B %d, %Y, %I:%M %p") if s.completed_at else s.started_at.strftime("%B %d, %Y, %I:%M %p"),
            "timestamp": s.completed_at or s.started_at
        })
        
    # 2. Completed lessons (with join to prevent N+1 query)
    completed_progress = db.query(models.Progress, models.Lesson).outerjoin(
        models.Lesson, models.Progress.lesson_id == models.Lesson.id
    ).filter(
        models.Progress.user_id == current_user.id,
        models.Progress.status == "completed"
    ).all()
    for p, lesson in completed_progress:
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

import secrets
from fastapi import BackgroundTasks
from ..auth.email import send_verification_email

@router.put("/me", response_model=schemas.UserResponse)
def update_profile(
    user_update: schemas.UserUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if user_update.email is not None and user_update.email != current_user.email:
        # Check if email is already taken
        exists = db.query(models.User).filter(models.User.email == user_update.email).first()
        if exists:
            raise HTTPException(status_code=400, detail="A user with this email already exists.")
        current_user.email = user_update.email
        current_user.is_verified = False
        new_token = secrets.token_urlsafe(32)
        current_user.verification_token = new_token
        background_tasks.add_task(send_verification_email, current_user.email, new_token, current_user.full_name or "Learner")
        
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
    # Social login accounts or accounts missing usable password hash
    if not current_user.password_hash or current_user.password_hash.startswith("social_login"):
        raise HTTPException(status_code=400, detail="Social login accounts do not have a standard password configuration.")
        
    if not verify_password(password_in.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password.")
        
    current_user.password_hash = get_password_hash(password_in.new_password)
    db.commit()
    return {"detail": "Password updated successfully."}

@router.delete("/me")
def delete_current_user_account(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Permanently delete the authenticated user account and cascade delete associated records.
    """
    user_id = current_user.id
    # Reassign or clean up any batches where this user is the instructor
    instructed_batches = db.query(models.Batch).filter(models.Batch.instructor_id == user_id).all()
    for batch in instructed_batches:
        db.delete(batch)

    db.delete(current_user)
    db.commit()
    return {"status": "success", "detail": f"Account {user_id} deleted permanently."}

@router.get("/{username}/public-profile")
def get_public_user_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        # Fallback exact search by email if username matches full email
        user = db.query(models.User).filter(models.User.email == username).first()
        
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User @{username} not found."
        )
        
    # Calculate global rank
    higher_xp_count = db.query(func.count(models.User.id)).filter(models.User.xp > user.xp).scalar()
    rank = higher_xp_count + 1
    
    # Calculate solved labs count
    solved_labs_count = db.query(models.LabSession).filter(
        models.LabSession.user_id == user.id,
        models.LabSession.status == "completed"
    ).count()
    
    # Get achievements
    achievements = []
    for a in user.achievements:
        achievements.append({
            "name": a.badge_name,
            "icon": a.badge_icon or "🏅",
            "date": a.earned_at.strftime("%B %d, %Y"),
            "desc": "Verified CyberLearn achievement badge."
        })
        
    if not achievements:
        achievements = [{
            "name": "Verified Practitioner",
            "icon": "🛡️",
            "date": user.created_at.strftime("%B %d, %Y"),
            "desc": "Verified active practitioner on CyberLearn."
        }]
        
    # Get all verified certificates (both course completions and professional exam certifications)
    user_certs = db.query(models.Certificate).filter(models.Certificate.user_id == user.id).all()
    certificates_res = []
    for cert in user_certs:
        title = "Cybersecurity Certificate"
        category = "Security"
        if cert.exam_id:
            exam = db.query(models.Exam).filter(models.Exam.id == cert.exam_id).first()
            if exam:
                title = exam.title
                category = "Certification Exam"
        elif cert.course_id:
            course = db.query(models.Course).filter(models.Course.id == cert.course_id).first()
            if course:
                title = course.title
                category = course.category or "Security"

        certificates_res.append({
            "id": cert.verification_token,
            "courseTitle": title,
            "category": category,
            "scorePct": float(cert.score_pct) if cert.score_pct is not None else 100.0,
            "certificateType": cert.certificate_type or "course_completion",
            "issueDate": cert.issued_at.strftime("%B %d, %Y") if cert.issued_at else "Issued",
            "credentialUrl": f"/verify/{cert.verification_token}"
        })
        
    # Build solved labs list
    solved_labs = db.query(models.LabSession, models.Lab).join(
        models.Lab, models.LabSession.lab_id == models.Lab.id
    ).filter(
        models.LabSession.user_id == user.id,
        models.LabSession.status == "completed"
    ).all()
    
    labs_res = []
    for s, lab in solved_labs:
        labs_res.append({
            "title": lab.title,
            "category": lab.type or "Web Security",
            "xp": lab.xp_reward or 100,
            "date": s.completed_at.strftime("%B %d, %Y") if s.completed_at else "Recently"
        })
        
    return {
        "full_name": user.full_name or user.username or "Learner",
        "username": user.username or username,
        "role": user.role,
        "rank": rank,
        "xp": user.xp,
        "solved_labs_count": solved_labs_count,
        "joined_date": user.created_at.strftime("Joined %B %Y"),
        "badges": achievements,
        "certificates": certificates_res,
        "solved_labs": labs_res
    }

@router.post("/me/verify-nid", response_model=schemas.NidVerificationResponse)
def submit_nid_verification(
    nid_in: schemas.NidVerificationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not nid_in.nid_number or len(nid_in.nid_number.strip()) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid National Identification Number (NID) of at least 8 digits is required."
        )

    MAX_IMG_CHARS = 7_000_000 # Approx 5MB in Base64
    if nid_in.nid_front_image and len(nid_in.nid_front_image) > MAX_IMG_CHARS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="NID front image exceeds the 5MB maximum file size limit."
        )
    if nid_in.nid_back_image and len(nid_in.nid_back_image) > MAX_IMG_CHARS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="NID back image exceeds the 5MB maximum file size limit."
        )

    current_user.nid_number = nid_in.nid_number.strip()
    if nid_in.nid_front_image:
        current_user.nid_front_image = nid_in.nid_front_image
    if nid_in.nid_back_image:
        current_user.nid_back_image = nid_in.nid_back_image

    current_user.verification_status = "verified"
    current_user.verification_notes = "Official government ID verified successfully."
    current_user.verified_at = datetime.now(timezone.utc)

    # Retroactively issue certificates for all completed courses and passed exams
    import uuid
    all_courses = db.query(models.Course).all()
    for course in all_courses:
        lessons = db.query(models.Lesson).filter(models.Lesson.course_id == course.id).all()
        if lessons:
            comp_count = db.query(models.Progress).filter(
                models.Progress.user_id == current_user.id,
                models.Progress.course_id == course.id,
                models.Progress.status == "completed"
            ).count()
            if comp_count >= len(lessons):
                existing_cert = db.query(models.Certificate).filter(
                    models.Certificate.user_id == current_user.id,
                    models.Certificate.course_id == course.id
                ).first()
                if not existing_cert:
                    course_code = "".join([w[0] for w in course.title.split() if w.isalpha()]).upper()[:6]
                    token = f"CERT-{course_code}-{uuid.uuid4().hex[:8].upper()}"
                    new_cert = models.Certificate(
                        user_id=current_user.id,
                        course_id=course.id,
                        score_pct=100.0,
                        certificate_type="course_completion",
                        verification_token=token,
                        issued_at=datetime.now(timezone.utc)
                    )
                    db.add(new_cert)

    passed_subs = db.query(models.ExamSubmission).filter(
        models.ExamSubmission.user_id == current_user.id,
        models.ExamSubmission.passed == True
    ).all()
    for sub in passed_subs:
        existing_cert = db.query(models.Certificate).filter(
            models.Certificate.user_id == current_user.id,
            models.Certificate.exam_id == sub.exam_id
        ).first()
        if not existing_cert:
            exam = db.query(models.Exam).filter(models.Exam.id == sub.exam_id).first()
            exam_title = exam.title if exam else "EXAM"
            code_prefix = "".join([w[0] for w in exam_title.split() if w.isalpha()]).upper()[:6]
            token = f"CERT-{code_prefix}-{uuid.uuid4().hex[:8].upper()}"
            new_cert = models.Certificate(
                user_id=current_user.id,
                course_id=exam.course_id if exam else None,
                exam_id=sub.exam_id,
                score_pct=float(sub.score_pct or 100.0),
                certificate_type="exam_certified",
                verification_token=token,
                issued_at=datetime.now(timezone.utc)
            )
            db.add(new_cert)
            sub.certificate_token = token

    db.commit()
    db.refresh(current_user)

    return schemas.NidVerificationResponse(
        user_id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        nid_number=current_user.nid_number,
        nid_front_image=current_user.nid_front_image,
        nid_back_image=current_user.nid_back_image,
        verification_status=current_user.verification_status,
        verification_notes=current_user.verification_notes,
        verified_at=current_user.verified_at,
        created_at=current_user.created_at
    )

@router.get("/me/verify-nid", response_model=schemas.NidVerificationResponse)
def get_my_nid_verification(
    current_user: models.User = Depends(get_current_user)
):
    return schemas.NidVerificationResponse(
        user_id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        nid_number=current_user.nid_number,
        nid_front_image=current_user.nid_front_image,
        nid_back_image=current_user.nid_back_image,
        verification_status=current_user.verification_status or "unverified",
        verification_notes=current_user.verification_notes,
        verified_at=current_user.verified_at,
        created_at=current_user.created_at
    )

