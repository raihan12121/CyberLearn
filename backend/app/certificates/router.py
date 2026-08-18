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

from sqlalchemy.orm import joinedload
from sqlalchemy import func

@router.get("")
def get_user_certificates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Ensure courses exist by triggering course seeding if empty
    from ..courses.router import seed_database_if_empty
    seed_database_if_empty(db)
    
    # Query all courses with eager loaded lessons (1 query instead of N queries)
    courses = db.query(models.Course).options(
        joinedload(models.Course.lessons)
    ).filter(models.Course.is_published == True).all()

    # Batch query all completed lesson IDs for this user (1 query)
    completed_lesson_ids = set(
        row[0] for row in db.query(models.Progress.lesson_id).filter(
            models.Progress.user_id == current_user.id,
            models.Progress.status == "completed"
        ).all()
    )

    # Batch query all existing certificates for this user (1 query)
    existing_certs = {
        c.course_id: c for c in db.query(models.Certificate).filter(
            models.Certificate.user_id == current_user.id
        ).all()
    }
    
    certificates_res = []
    has_new_certs = False
    
    for course in courses:
        lessons = course.lessons or []
        total_lessons = len(lessons)
        
        # Count user's completed progress in these lessons in-memory (0 DB queries)
        completed_lessons = sum(1 for l in lessons if l.id in completed_lesson_ids)
            
        # Is the course completed?
        is_completed = total_lessons > 0 and completed_lessons == total_lessons
        certificate = existing_certs.get(course.id)
        
        if is_completed and not certificate:
            # Generate new certificate token using UUID
            course_code = "".join([w[0] for w in course.title.split() if w.isalpha()]).upper()
            verification_token = f"CERT-{course_code}-{uuid.uuid4().hex[:8].upper()}"
            
            xp_reward = 1000
            current_user.xp += xp_reward
            
            certificate = models.Certificate(
                user_id=current_user.id,
                course_id=course.id,
                verification_token=verification_token,
                issued_at=datetime.now(timezone.utc)
            )
            db.add(certificate)
            existing_certs[course.id] = certificate
            has_new_certs = True
            
        # Add to response
        if certificate:
            certificates_res.append({
                "id": certificate.verification_token,
                "courseTitle": course.title,
                "category": course.category or "Security",
                "issueDate": certificate.issued_at.strftime("%B %d, %Y") if certificate.issued_at else "Issued",
                "credentialUrl": f"/verify/{certificate.verification_token}",
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
            
    if has_new_certs:
        db.commit()
        
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
        "status": "valid",
        "token": cert.verification_token,
        "student_name": user.full_name or user.username if user else "Verified Student",
        "course_title": course.title if course else "Cybersecurity Course",
        "category": course.category if course else "Web Security",
        "score_pct": float(cert.score_pct) if cert.score_pct else 100.0,
        "certificate_type": cert.certificate_type or "course_completion",
        "issued_at": cert.issued_at.strftime("%B %d, %Y"),
        "issuer": "CyberLearn Security Academy",
        "verification_url": f"/verify/{cert.verification_token}"
    }
