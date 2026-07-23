from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid
import random
from typing import List
from ..database import get_db
from .. import models
from ..auth.dependencies import get_current_user

router = APIRouter(
    prefix="/certificates",
    tags=["Certificates"]
)

@router.get("")
def get_user_certificates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Ensure courses exist by triggering course seeding if empty
    from ..courses.router import seed_database_if_empty
    seed_database_if_empty(db)
    
    # Query all courses
    courses = db.query(models.Course).filter(models.Course.is_published == True).all()
    
    certificates_res = []
    
    for course in courses:
        # Get lessons for course
        lessons = db.query(models.Lesson).filter(models.Lesson.course_id == course.id).all()
        total_lessons = len(lessons)
        
        # Count user's completed progress in these lessons
        completed_lessons = 0
        if total_lessons > 0:
            lesson_ids = [l.id for l in lessons]
            completed_lessons = db.query(models.Progress).filter(
                models.Progress.user_id == current_user.id,
                models.Progress.lesson_id.in_(lesson_ids),
                models.Progress.status == "completed"
            ).count()
            
        # Is the course completed?
        is_completed = total_lessons > 0 and completed_lessons == total_lessons
        
        # Check if certificate already exists
        certificate = db.query(models.Certificate).filter(
            models.Certificate.user_id == current_user.id,
            models.Certificate.course_id == course.id
        ).first()
        
        if is_completed and not certificate:
            # Generate new certificate token using UUID to guarantee uniqueness
            course_code = "".join([w[0] for w in course.title.split() if w.isalpha()]).upper()
            verification_token = f"CERT-{course_code}-{uuid.uuid4().hex[:8].upper()}"
            
            # Award course completion XP (e.g. 1000 XP)
            xp_reward = 1000
            current_user.xp += xp_reward
            
            certificate = models.Certificate(
                user_id=current_user.id,
                course_id=course.id,
                verification_token=verification_token,
                issued_at=datetime.now(timezone.utc)
            )
            db.add(certificate)
            db.commit()
            db.refresh(certificate)
            
        # Add to response
        if certificate:
            certificates_res.append({
                "id": certificate.verification_token,
                "courseTitle": course.title,
                "category": course.category or "Security",
                "issueDate": certificate.issued_at.strftime("%B %d, %Y"),
                "credentialUrl": f"https://cyberlearn.edu/verify/{certificate.verification_token}",
                "xpEarned": 1000,
                "status": "issued"
            })
        else:
            certificates_res.append({
                "id": f"LOCKED-{course.id}",
                "courseTitle": course.title,
                "category": course.category or "Security",
                "issueDate": "In Progress" if completed_lessons > 0 else "Not Started",
                "credentialUrl": "",
                "xpEarned": 0,
                "status": "locked"
            })
            
    return certificates_res

@router.get("/verify/{token}")
def verify_certificate_token(token: str, db: Session = Depends(get_db)):
    cert = db.query(models.Certificate).filter(models.Certificate.verification_token == token).first()
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate verification token not found or invalid."
        )
        
    user = db.query(models.User).filter(models.User.id == cert.user_id).first()
    course = db.query(models.Course).filter(models.Course.id == cert.course_id).first()
    
    return {
        "valid": True,
        "token": cert.verification_token,
        "student_name": user.full_name or user.username if user else "Verified Student",
        "course_title": course.title if course else "Cybersecurity Course",
        "category": course.category if course else "Web Security",
        "issued_at": cert.issued_at.strftime("%B %d, %Y"),
        "issuer": "CyberLearn Security Academy",
        "verification_url": f"/verify/{cert.verification_token}"
    }
