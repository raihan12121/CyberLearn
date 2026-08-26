from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
import uuid
from typing import List, Optional
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
    # Ensure courses and exams exist by triggering seeding if empty
    from ..courses.router import seed_database_if_empty
    from ..exams.router import seed_default_exams_if_empty
    seed_database_if_empty(db)
    seed_default_exams_if_empty(db)

    is_verified = (current_user.verification_status == "verified")

    # 1. Fetch all officially issued user certificates from database
    user_certs = db.query(models.Certificate).filter(
        models.Certificate.user_id == current_user.id
    ).order_by(models.Certificate.issued_at.desc()).all()

    # Pre-fetch referenced courses and exams
    course_ids = [c.course_id for c in user_certs if c.course_id]
    exam_ids = [c.exam_id for c in user_certs if c.exam_id]

    courses_map = {c.id: c for c in db.query(models.Course).filter(models.Course.id.in_(course_ids)).all()} if course_ids else {}
    exams_map = {e.id: e for e in db.query(models.Exam).filter(models.Exam.id.in_(exam_ids)).all()} if exam_ids else {}

    certificates_res = []
    issued_cert_keys = set()

    for cert in user_certs:
        title = "Cybersecurity Credential"
        category = "Security"
        
        if cert.exam_id and cert.exam_id in exams_map:
            exam = exams_map[cert.exam_id]
            title = exam.title
            category = "Certification Exam"
            issued_cert_keys.add(f"exam:{cert.exam_id}")
        elif cert.course_id and cert.course_id in courses_map:
            course = courses_map[cert.course_id]
            title = course.title
            category = course.category or "Security"
            issued_cert_keys.add(f"course:{cert.course_id}")

        certificates_res.append({
            "id": cert.verification_token,
            "courseTitle": title,
            "category": category,
            "certificateType": cert.certificate_type or "course_completion",
            "scorePct": float(cert.score_pct) if cert.score_pct is not None else 100.0,
            "issueDate": cert.issued_at.strftime("%B %d, %Y") if cert.issued_at else "Issued",
            "credentialUrl": f"/verify/{cert.verification_token}",
            "xpEarned": 1000 if cert.certificate_type == "course_completion" else 800,
            "status": "issued"
        })

    # 2. Check for completed courses
    all_courses = db.query(models.Course).options(
        joinedload(models.Course.lessons)
    ).filter(models.Course.is_published == True).all()

    completed_lesson_ids = set(
        row[0] for row in db.query(models.Progress.lesson_id).filter(
            models.Progress.user_id == current_user.id,
            models.Progress.status == "completed"
        ).all()
    )

    has_new_certs = False
    for course in all_courses:
        if f"course:{course.id}" in issued_cert_keys:
            continue

        lessons = course.lessons or []
        total_lessons = len(lessons)
        completed_lessons = sum(1 for l in lessons if l.id in completed_lesson_ids)
        is_completed = total_lessons > 0 and completed_lessons == total_lessons

        if is_completed:
            if is_verified:
                # Issue official certificate for verified learner
                course_code = "".join([w[0] for w in course.title.split() if w.isalpha()]).upper()[:6]
                verification_token = f"CERT-{course_code}-{uuid.uuid4().hex[:8].upper()}"
                current_user.xp += 1000

                new_cert = models.Certificate(
                    user_id=current_user.id,
                    course_id=course.id,
                    certificate_type="course_completion",
                    score_pct=100.0,
                    verification_token=verification_token,
                    issued_at=datetime.now(timezone.utc)
                )
                db.add(new_cert)
                has_new_certs = True
                issued_cert_keys.add(f"course:{course.id}")

                certificates_res.insert(0, {
                    "id": verification_token,
                    "courseTitle": course.title,
                    "category": course.category or "Security",
                    "certificateType": "course_completion",
                    "scorePct": 100.0,
                    "issueDate": datetime.now(timezone.utc).strftime("%B %d, %Y"),
                    "credentialUrl": f"/verify/{verification_token}",
                    "xpEarned": 1000,
                    "status": "issued"
                })
            else:
                # Requires ID verification
                certificates_res.insert(0, {
                    "id": f"PENDING-NID-{course.id}",
                    "courseTitle": course.title,
                    "category": course.category or "Security",
                    "certificateType": "course_completion",
                    "scorePct": 100.0,
                    "issueDate": "ID Verification Required",
                    "credentialUrl": "/verify-nid",
                    "xpEarned": 1000,
                    "status": "verification_required",
                    "message": "Course Completed! Verify your National ID at /verify-nid to claim this certificate."
                })
                issued_cert_keys.add(f"course:{course.id}")
        else:
            # Locked / In Progress Course
            certificates_res.append({
                "id": f"LOCKED-{course.id}",
                "courseTitle": course.title,
                "category": course.category or "Security",
                "certificateType": "course_completion",
                "scorePct": 0.0,
                "issueDate": "In Progress" if completed_lessons > 0 else "Not Started",
                "credentialUrl": "",
                "xpEarned": 0,
                "status": "locked",
                "progressPct": round((completed_lessons / total_lessons * 100) if total_lessons > 0 else 0, 1)
            })

    # 3. Check for passed exams requiring ID verification
    passed_subs = db.query(models.ExamSubmission).filter(
        models.ExamSubmission.user_id == current_user.id,
        models.ExamSubmission.passed == True
    ).all()

    for sub in passed_subs:
        if f"exam:{sub.exam_id}" not in issued_cert_keys:
            exam = db.query(models.Exam).filter(models.Exam.id == sub.exam_id).first()
            exam_title = exam.title if exam else "Certification Exam"
            if not is_verified:
                certificates_res.insert(0, {
                    "id": f"PENDING-NID-EXAM-{sub.exam_id}",
                    "courseTitle": exam_title,
                    "category": "Certification Exam",
                    "certificateType": "exam_certified",
                    "scorePct": float(sub.score_pct or 100.0),
                    "issueDate": "ID Verification Required",
                    "credentialUrl": "/verify-nid",
                    "xpEarned": 800,
                    "status": "verification_required",
                    "message": "Exam Passed! Complete ID verification at /verify-nid to unlock your official credential."
                })
                issued_cert_keys.add(f"exam:{sub.exam_id}")

    # 4. Add available certification tracks
    all_exams = db.query(models.Exam).filter(models.Exam.is_published == True).all()
    for exam in all_exams:
        if f"exam:{exam.id}" not in issued_cert_keys:
            certificates_res.append({
                "id": f"LOCKED-EXAM-{exam.id}",
                "courseTitle": exam.title,
                "category": "Certification Exam",
                "certificateType": "exam_certified",
                "scorePct": 0.0,
                "issueDate": "Available to Take",
                "credentialUrl": f"/exams",
                "xpEarned": 0,
                "status": "locked"
            })

    if has_new_certs:
        db.commit()

    return certificates_res

@router.get("/verify/{token}")
def verify_certificate_token(token: str, db: Session = Depends(get_db)):
    cert = db.query(models.Certificate).filter(
        (models.Certificate.verification_token == token) | (models.Certificate.id == token)
    ).first()
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate verification token not found or invalid."
        )

    user = db.query(models.User).filter(models.User.id == cert.user_id).first()
    
    title = "Cybersecurity Credential"
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

    return {
        "valid": True,
        "status": "valid",
        "token": cert.verification_token,
        "student_name": (user.full_name or user.username) if user else "Verified Student",
        "course_title": title,
        "category": category,
        "score_pct": float(cert.score_pct) if cert.score_pct is not None else 100.0,
        "certificate_type": cert.certificate_type or "course_completion",
        "issued_at": cert.issued_at.strftime("%B %d, %Y") if cert.issued_at else "Issued",
        "issuer": "CyberLearn Security Academy",
        "verification_url": f"/verify/{cert.verification_token}"
    }
