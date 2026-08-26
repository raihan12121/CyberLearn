import random
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from ..database import get_db
from .. import models, schemas
from ..auth.dependencies import get_current_user
from ..auth.utils import get_password_hash
from ..batches.router import generate_batch_code

router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"]
)

# Admin Authorization Dependency
def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have administrative privileges to access this resource."
        )
    return current_user


# ==========================================
# 1. System Metrics & Telemetry
# ==========================================

@router.get("/metrics")
def get_admin_metrics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    total_users = db.query(models.User).count()
    active_sandboxes = db.query(models.LabSession).filter(models.LabSession.status == "running").count()
    completed_labs = db.query(models.LabSession).filter(models.LabSession.status == "completed").count()
    
    total_courses = db.query(models.Course).count()
    total_exams = db.query(models.Exam).count()
    total_batches = db.query(models.Batch).count()
    total_certs = db.query(models.Certificate).count()
    total_posts = db.query(models.Post).count()
    
    # Financial calculations
    paid_invoices = db.query(models.Invoice).filter(models.Invoice.status == "paid").all()
    total_revenue = sum(float(inv.total_paid or 0.0) for inv in paid_invoices)
    active_subscriptions = db.query(models.User).filter(
        models.User.subscription_status == "active"
    ).count()

    db_connections = random.randint(12, 18)
    cpu_load = random.randint(30, 48)
    ram_used = random.randint(58, 66)

    container_templates = [
        {"name": "linux-navigation-sandbox", "users": db.query(models.LabSession).filter(models.LabSession.lab_id == "linux-navigation", models.LabSession.status == "running").count(), "status": "Healthy", "cpu": "12%", "memory": "1.2 GB"},
        {"name": "sqli-bypass-sandbox", "users": db.query(models.LabSession).filter(models.LabSession.lab_id == "sql-injection-bypass", models.LabSession.status == "running").count(), "status": "Healthy", "cpu": "24%", "memory": "2.1 GB"},
        {"name": "wireshark-sniffer-sandbox", "users": db.query(models.LabSession).filter(models.LabSession.lab_id == "packet-sniffer-recon", models.LabSession.status == "running").count(), "status": "Healthy", "cpu": "8%", "memory": "890 MB"},
        {"name": "cron-privesc-sandbox", "users": 0, "status": "Healthy", "cpu": "2%", "memory": "250 MB"},
    ]

    recent_errors = [
        {"source": "FastAPI Engine", "msg": f"Total registered platform learners: {total_users}", "level": "Info", "time": "2m ago"},
        {"source": "Docker Daemon", "msg": f"Active sandbox container instances running: {active_sandboxes}", "level": "Info", "time": "8m ago"},
        {"source": "Billing Gateway", "msg": f"Gross settled revenue: ${total_revenue:,.2f} USD ({len(paid_invoices)} invoices)", "level": "Info", "time": "15m ago"},
    ]

    return {
        "stats": [
            { "label": "Total Users", "value": f"{total_users:,}", "change": "+12% this month", "color": "text-primary", "bg": "bg-primary/10" },
            { "label": "Total Revenue", "value": f"${total_revenue:,.2f}", "change": f"{active_subscriptions} active subs", "color": "text-success", "bg": "bg-success/10" },
            { "label": "Active Sandboxes", "value": f"{active_sandboxes}", "change": f"{cpu_load}% CPU load", "color": "text-accent", "bg": "bg-accent/10" },
            { "label": "Issued Credentials", "value": f"{total_certs:,}", "change": f"{total_exams} active tracks", "color": "text-warning", "bg": "bg-warning/10" },
        ],
        "summary": {
            "total_users": total_users,
            "total_revenue": total_revenue,
            "active_subscriptions": active_subscriptions,
            "active_sandboxes": active_sandboxes,
            "completed_labs": completed_labs,
            "total_courses": total_courses,
            "total_exams": total_exams,
            "total_batches": total_batches,
            "total_certs": total_certs,
            "total_posts": total_posts,
        },
        "containers": container_templates,
        "resources": {
            "cpu": cpu_load,
            "ram": ram_used,
            "storage": 78,
            "db_conn": db_connections
        },
        "errors": recent_errors
    }


# ==========================================
# 2. User & Access Control Management
# ==========================================

@router.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    query = db.query(models.User)
    if role and role != "all":
        query = query.filter(models.User.role == role)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (models.User.email.ilike(search_term)) |
            (models.User.full_name.ilike(search_term)) |
            (models.User.username.ilike(search_term))
        )
    return query.order_by(models.User.created_at.desc()).all()

@router.post("/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user_by_admin(
    user_in: schemas.AdminUserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    # Check if email exists
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Check username
    username = user_in.username or user_in.email.split("@")[0]
    if db.query(models.User).filter(models.User.username == username).first():
        username = f"{username}_{random.randint(100, 999)}"

    new_user = models.User(
        email=user_in.email,
        username=username,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name or username,
        role=user_in.role or "student",
        subscription_tier=user_in.subscription_tier or "free",
        subscription_status=user_in.subscription_status or "inactive",
        xp=user_in.xp or 0,
        is_verified=user_in.is_verified or False,
        is_onboarded=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user_by_admin(
    user_id: str,
    user_in: schemas.AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user_in.email is not None:
        user.email = user_in.email
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.username is not None:
        user.username = user_in.username
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.subscription_tier is not None:
        user.subscription_tier = user_in.subscription_tier
    if user_in.subscription_status is not None:
        user.subscription_status = user_in.subscription_status
    if user_in.xp is not None:
        user.xp = user_in.xp
    if user_in.streak_days is not None:
        user.streak_days = user_in.streak_days
    if user_in.is_verified is not None:
        user.is_verified = user_in.is_verified
    if user_in.verification_status is not None:
        user.verification_status = user_in.verification_status
    if user_in.verification_notes is not None:
        user.verification_notes = user_in.verification_notes

    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_by_admin(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own active administrator account."
        )

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    db.query(models.Progress).filter(models.Progress.user_id == user_id).delete()
    db.query(models.Achievement).filter(models.Achievement.user_id == user_id).delete()
    db.query(models.BatchEnrollment).filter(models.BatchEnrollment.user_id == user_id).delete()
    db.query(models.ExamSubmission).filter(models.ExamSubmission.user_id == user_id).delete()
    db.query(models.Certificate).filter(models.Certificate.user_id == user_id).delete()
    db.query(models.LabSession).filter(models.LabSession.user_id == user_id).delete()
    db.query(models.CoursePurchase).filter(models.CoursePurchase.user_id == user_id).delete()
    db.query(models.Invoice).filter(models.Invoice.user_id == user_id).delete()

    db.delete(user)
    db.commit()
    return None


# ==========================================
# 3. KYC / NID Identity Verifications
# ==========================================

@router.get("/verifications", response_model=List[schemas.NidVerificationResponse])
def get_verifications(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    query = db.query(models.User).filter(models.User.nid_number.isnot(None))
    if status_filter:
        query = query.filter(models.User.verification_status == status_filter)
    users = query.order_by(models.User.created_at.desc()).all()
    
    return [
        schemas.NidVerificationResponse(
            user_id=u.id,
            full_name=u.full_name,
            email=u.email,
            nid_number=u.nid_number,
            nid_front_image=u.nid_front_image,
            nid_back_image=u.nid_back_image,
            nid_front_url=u.nid_front_image,
            nid_back_url=u.nid_back_image,
            verification_status=u.verification_status or "unverified",
            verification_notes=u.verification_notes,
            verified_at=u.verified_at,
            created_at=u.created_at
        )
        for u in users
    ]

@router.post("/verifications/{user_id}/review", response_model=schemas.NidVerificationResponse)
def review_nid_verification(
    user_id: str,
    review: schemas.NidVerificationReviewRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if review.status not in ["verified", "rejected", "pending"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status.")

    target_user.verification_status = review.status
    target_user.verification_notes = review.notes or (
        "National ID verified by Administrator." if review.status == "verified" else "Verification rejected."
    )
    if review.status == "verified":
        target_user.verified_at = datetime.now(timezone.utc)
        target_user.is_verified = True
    else:
        target_user.verified_at = None
        target_user.is_verified = False

    db.commit()
    db.refresh(target_user)

    return schemas.NidVerificationResponse(
        user_id=target_user.id,
        full_name=target_user.full_name,
        email=target_user.email,
        nid_number=target_user.nid_number,
        nid_front_image=target_user.nid_front_image,
        nid_back_image=target_user.nid_back_image,
        nid_front_url=target_user.nid_front_image,
        nid_back_url=target_user.nid_back_image,
        verification_status=target_user.verification_status,
        verification_notes=target_user.verification_notes,
        verified_at=target_user.verified_at,
        created_at=target_user.created_at
    )


# ==========================================
# 4. Courses & Lesson Syllabus Management
# ==========================================

@router.get("/courses")
def get_admin_courses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    courses = db.query(models.Course).options(joinedload(models.Course.lessons)).order_by(models.Course.created_at.desc()).all()
    results = []
    for c in courses:
        results.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "difficulty": c.difficulty,
            "category": c.category,
            "price": float(c.price or 49.00),
            "estimated_duration": c.estimated_duration,
            "thumbnail_url": c.thumbnail_url,
            "is_published": c.is_published,
            "lesson_count": len(c.lessons) if c.lessons else 0,
            "created_at": c.created_at
        })
    return results

@router.post("/courses", status_code=status.HTTP_201_CREATED)
def create_course_by_admin(
    course_in: schemas.AdminCourseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    course_id = course_in.id or str(uuid.uuid4())
    if db.query(models.Course).filter(models.Course.id == course_id).first():
        course_id = f"{course_id}-{uuid.uuid4().hex[:4]}"

    new_course = models.Course(
        id=course_id,
        title=course_in.title,
        description=course_in.description,
        difficulty=course_in.difficulty or "Beginner",
        category=course_in.category or "Web Security",
        price=course_in.price or 49.00,
        estimated_duration=course_in.estimated_duration or 300,
        thumbnail_url=course_in.thumbnail_url,
        is_published=course_in.is_published if course_in.is_published is not None else True
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

@router.put("/courses/{course_id}")
def update_course_by_admin(
    course_id: str,
    course_in: schemas.AdminCourseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

    if course_in.title is not None:
        course.title = course_in.title
    if course_in.description is not None:
        course.description = course_in.description
    if course_in.difficulty is not None:
        course.difficulty = course_in.difficulty
    if course_in.category is not None:
        course.category = course_in.category
    if course_in.price is not None:
        course.price = course_in.price
    if course_in.estimated_duration is not None:
        course.estimated_duration = course_in.estimated_duration
    if course_in.thumbnail_url is not None:
        course.thumbnail_url = course_in.thumbnail_url
    if course_in.is_published is not None:
        course.is_published = course_in.is_published

    db.commit()
    db.refresh(course)
    return course

@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_by_admin(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

    db.query(models.Lesson).filter(models.Lesson.course_id == course_id).delete()
    db.query(models.Progress).filter(models.Progress.course_id == course_id).delete()
    db.query(models.Certificate).filter(models.Certificate.course_id == course_id).delete()
    db.query(models.CoursePurchase).filter(models.CoursePurchase.course_id == course_id).delete()

    db.delete(course)
    db.commit()
    return None

@router.get("/courses/{course_id}/lessons")
def get_admin_course_lessons(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    lessons = db.query(models.Lesson).filter(models.Lesson.course_id == course_id).order_by(models.Lesson.sort_order.asc()).all()
    return lessons

@router.post("/courses/{course_id}/lessons", status_code=status.HTTP_201_CREATED)
def create_lesson_by_admin(
    course_id: str,
    lesson_in: schemas.AdminLessonCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

    lesson_id = lesson_in.id or str(uuid.uuid4())
    new_lesson = models.Lesson(
        id=lesson_id,
        course_id=course_id,
        title=lesson_in.title,
        content_type=lesson_in.content_type or "video",
        content=lesson_in.content,
        video_url=lesson_in.video_url,
        sort_order=lesson_in.sort_order or 0,
        duration=lesson_in.duration or 10
    )
    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)
    return new_lesson

@router.put("/lessons/{lesson_id}")
def update_lesson_by_admin(
    lesson_id: str,
    lesson_in: schemas.AdminLessonUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found.")

    if lesson_in.title is not None:
        lesson.title = lesson_in.title
    if lesson_in.content_type is not None:
        lesson.content_type = lesson_in.content_type
    if lesson_in.content is not None:
        lesson.content = lesson_in.content
    if lesson_in.video_url is not None:
        lesson.video_url = lesson_in.video_url
    if lesson_in.sort_order is not None:
        lesson.sort_order = lesson_in.sort_order
    if lesson_in.duration is not None:
        lesson.duration = lesson_in.duration

    db.commit()
    db.refresh(lesson)
    return lesson

@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson_by_admin(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found.")
    db.delete(lesson)
    db.commit()
    return None


# ==========================================
# 5. Certification Exams & Question Banks
# ==========================================

@router.get("/exams")
def get_admin_exams(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    from ..exams.router import seed_default_exams_if_empty
    seed_default_exams_if_empty(db)

    exams = db.query(models.Exam).options(
        joinedload(models.Exam.questions),
        joinedload(models.Exam.submissions)
    ).order_by(models.Exam.created_at.desc()).all()

    results = []
    for e in exams:
        results.append({
            "id": e.id,
            "title": e.title,
            "course_id": e.course_id,
            "description": e.description,
            "duration_minutes": e.duration_minutes,
            "passing_score_pct": e.passing_score_pct,
            "total_marks": e.total_marks,
            "is_published": e.is_published,
            "question_count": len(e.questions) if e.questions else 0,
            "submission_count": len(e.submissions) if e.submissions else 0,
            "created_at": e.created_at
        })
    return results

@router.post("/exams", status_code=status.HTTP_201_CREATED)
def create_exam_by_admin(
    exam_in: schemas.AdminExamCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    exam_id = exam_in.id or f"exam-{uuid.uuid4().hex[:8]}"
    new_exam = models.Exam(
        id=exam_id,
        course_id=exam_in.course_id,
        title=exam_in.title,
        description=exam_in.description,
        duration_minutes=exam_in.duration_minutes or 45,
        passing_score_pct=exam_in.passing_score_pct or 70,
        total_marks=exam_in.total_marks or 100,
        is_published=exam_in.is_published if exam_in.is_published is not None else True
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)
    return new_exam

@router.put("/exams/{exam_id}")
def update_exam_by_admin(
    exam_id: str,
    exam_in: schemas.AdminExamUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found.")

    if exam_in.title is not None:
        exam.title = exam_in.title
    if exam_in.course_id is not None:
        exam.course_id = exam_in.course_id
    if exam_in.description is not None:
        exam.description = exam_in.description
    if exam_in.duration_minutes is not None:
        exam.duration_minutes = exam_in.duration_minutes
    if exam_in.passing_score_pct is not None:
        exam.passing_score_pct = exam_in.passing_score_pct
    if exam_in.total_marks is not None:
        exam.total_marks = exam_in.total_marks
    if exam_in.is_published is not None:
        exam.is_published = exam_in.is_published

    db.commit()
    db.refresh(exam)
    return exam

@router.delete("/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam_by_admin(
    exam_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found.")

    db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam_id).delete()
    db.query(models.ExamSubmission).filter(models.ExamSubmission.exam_id == exam_id).delete()
    db.query(models.Certificate).filter(models.Certificate.exam_id == exam_id).delete()

    db.delete(exam)
    db.commit()
    return None

@router.get("/exams/{exam_id}/questions")
def get_admin_exam_questions(
    exam_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    questions = db.query(models.ExamQuestion).filter(
        models.ExamQuestion.exam_id == exam_id
    ).order_by(models.ExamQuestion.sort_order.asc()).all()
    return questions

@router.post("/exams/{exam_id}/questions", status_code=status.HTTP_201_CREATED)
def create_exam_question_by_admin(
    exam_id: str,
    q_in: schemas.AdminQuestionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found.")

    new_q = models.ExamQuestion(
        id=str(uuid.uuid4()),
        exam_id=exam_id,
        question_text=q_in.question_text,
        question_type=q_in.question_type or "mcq",
        options=q_in.options,
        correct_answer=q_in.correct_answer,
        explanation=q_in.explanation,
        points=q_in.points or 5,
        sort_order=q_in.sort_order or 0
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)
    return new_q

@router.put("/exams/questions/{question_id}")
def update_exam_question_by_admin(
    question_id: str,
    q_in: schemas.AdminQuestionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    q = db.query(models.ExamQuestion).filter(models.ExamQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    if q_in.question_text is not None:
        q.question_text = q_in.question_text
    if q_in.question_type is not None:
        q.question_type = q_in.question_type
    if q_in.options is not None:
        q.options = q_in.options
    if q_in.correct_answer is not None:
        q.correct_answer = q_in.correct_answer
    if q_in.explanation is not None:
        q.explanation = q_in.explanation
    if q_in.points is not None:
        q.points = q_in.points
    if q_in.sort_order is not None:
        q.sort_order = q_in.sort_order

    db.commit()
    db.refresh(q)
    return q

@router.delete("/exams/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam_question_by_admin(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    q = db.query(models.ExamQuestion).filter(models.ExamQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
    db.delete(q)
    db.commit()
    return None

@router.get("/exams/submissions")
def get_all_exam_submissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    subs = db.query(models.ExamSubmission).options(
        joinedload(models.ExamSubmission.user),
        joinedload(models.ExamSubmission.exam)
    ).order_by(models.ExamSubmission.submitted_at.desc()).all()

    results = []
    for s in subs:
        results.append({
            "id": s.id,
            "user_id": s.user_id,
            "user_name": s.user.full_name or s.user.username if s.user else "Learner",
            "user_email": s.user.email if s.user else "N/A",
            "exam_id": s.exam_id,
            "exam_title": s.exam.title if s.exam else "Certification Exam",
            "score": float(s.score or 0),
            "total_score": float(s.total_score or 100),
            "score_pct": float(s.score_pct or 0),
            "passed": s.passed,
            "certificate_token": s.certificate_token,
            "submitted_at": s.submitted_at
        })
    return results


# ==========================================
# 6. Cohorts & Live Batches Management
# ==========================================

@router.get("/batches")
def get_admin_batches(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    from ..batches.router import seed_default_batches_if_empty
    seed_default_batches_if_empty(db)

    batches = db.query(models.Batch).options(
        joinedload(models.Batch.instructor),
        joinedload(models.Batch.course),
        joinedload(models.Batch.enrollments)
    ).order_by(models.Batch.created_at.desc()).all()

    results = []
    for b in batches:
        results.append({
            "id": b.id,
            "name": b.name,
            "batch_code": b.batch_code,
            "description": b.description,
            "instructor_id": b.instructor_id,
            "instructor_name": b.instructor.full_name if b.instructor else "Instructor",
            "course_id": b.course_id,
            "course_title": b.course.title if b.course else "All Modules",
            "start_date": b.start_date,
            "end_date": b.end_date,
            "max_students": b.max_students,
            "meeting_link": b.meeting_link,
            "schedule_details": b.schedule_details,
            "is_active": b.is_active,
            "enrolled_count": len(b.enrollments) if b.enrollments else 0,
            "created_at": b.created_at
        })
    return results

@router.post("/batches", status_code=status.HTTP_201_CREATED)
def create_batch_by_admin(
    batch_in: schemas.AdminBatchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    batch_code = batch_in.batch_code or generate_batch_code()
    while db.query(models.Batch).filter(models.Batch.batch_code == batch_code).first():
        batch_code = generate_batch_code()

    instructor_id = batch_in.instructor_id or current_user.id

    new_batch = models.Batch(
        name=batch_in.name,
        batch_code=batch_code,
        description=batch_in.description,
        instructor_id=instructor_id,
        course_id=batch_in.course_id,
        start_date=batch_in.start_date,
        end_date=batch_in.end_date,
        max_students=batch_in.max_students or 50,
        meeting_link=batch_in.meeting_link,
        schedule_details=batch_in.schedule_details,
        is_active=batch_in.is_active if batch_in.is_active is not None else True
    )
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)
    return new_batch

@router.put("/batches/{batch_id}")
def update_batch_by_admin(
    batch_id: str,
    batch_in: schemas.AdminBatchUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")

    if batch_in.name is not None:
        batch.name = batch_in.name
    if batch_in.description is not None:
        batch.description = batch_in.description
    if batch_in.instructor_id is not None:
        batch.instructor_id = batch_in.instructor_id
    if batch_in.course_id is not None:
        batch.course_id = batch_in.course_id
    if batch_in.start_date is not None:
        batch.start_date = batch_in.start_date
    if batch_in.end_date is not None:
        batch.end_date = batch_in.end_date
    if batch_in.max_students is not None:
        batch.max_students = batch_in.max_students
    if batch_in.meeting_link is not None:
        batch.meeting_link = batch_in.meeting_link
    if batch_in.schedule_details is not None:
        batch.schedule_details = batch_in.schedule_details
    if batch_in.is_active is not None:
        batch.is_active = batch_in.is_active

    db.commit()
    db.refresh(batch)
    return batch

@router.delete("/batches/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_batch_by_admin(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")

    db.query(models.BatchEnrollment).filter(models.BatchEnrollment.batch_id == batch_id).delete()

    db.delete(batch)
    db.commit()
    return None

@router.get("/batches/{batch_id}/students")
def get_admin_batch_students(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    enrollments = db.query(models.BatchEnrollment).options(
        joinedload(models.BatchEnrollment.user)
    ).filter(models.BatchEnrollment.batch_id == batch_id).all()

    results = []
    for e in enrollments:
        if e.user:
            results.append({
                "enrollment_id": e.id,
                "user_id": e.user.id,
                "full_name": e.user.full_name or e.user.username,
                "email": e.user.email,
                "xp": e.user.xp,
                "status": e.status,
                "enrolled_at": e.enrolled_at
            })
    return results

@router.post("/batches/{batch_id}/enroll")
def enroll_student_by_admin(
    batch_id: str,
    req: schemas.AdminBatchEnrollRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")

    target_user = None
    if req.user_id:
        target_user = db.query(models.User).filter(models.User.id == req.user_id).first()
    elif req.email:
        target_user = db.query(models.User).filter(models.User.email == req.email.strip()).first()

    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    # Check duplicate
    existing = db.query(models.BatchEnrollment).filter(
        models.BatchEnrollment.batch_id == batch_id,
        models.BatchEnrollment.user_id == target_user.id
    ).first()

    if existing:
        return {"status": "already_enrolled", "message": f"{target_user.email} is already enrolled in this batch."}

    enr = models.BatchEnrollment(
        batch_id=batch.id,
        user_id=target_user.id,
        status="enrolled",
        enrolled_at=datetime.now(timezone.utc)
    )
    db.add(enr)
    db.commit()
    return {"status": "success", "message": f"Successfully enrolled {target_user.email} into {batch.name}."}

@router.delete("/batches/{batch_id}/students/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_student_from_batch_by_admin(
    batch_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    enr = db.query(models.BatchEnrollment).filter(
        models.BatchEnrollment.batch_id == batch_id,
        models.BatchEnrollment.user_id == user_id
    ).first()
    if not enr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment record not found.")
    db.delete(enr)
    db.commit()
    return None


# ==========================================
# 7. Practice Labs & Container Pool
# ==========================================

@router.get("/labs")
def get_admin_labs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    from ..labs.router import seed_labs_if_empty
    seed_labs_if_empty(db)

    labs = db.query(models.Lab).options(joinedload(models.Lab.sessions)).all()
    results = []
    for l in labs:
        results.append({
            "id": l.id,
            "title": l.title,
            "description": l.description,
            "type": l.type,
            "difficulty": l.difficulty,
            "container_template": l.container_template,
            "xp_reward": l.xp_reward,
            "time_limit": l.time_limit,
            "session_count": len(l.sessions) if l.sessions else 0
        })
    return results

@router.post("/labs", status_code=status.HTTP_201_CREATED)
def create_lab_by_admin(
    lab_in: schemas.AdminLabCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    lab_id = lab_in.id or f"lab-{uuid.uuid4().hex[:8]}"
    new_lab = models.Lab(
        id=lab_id,
        title=lab_in.title,
        description=lab_in.description,
        type=lab_in.type or "Linux",
        difficulty=lab_in.difficulty or "Easy",
        container_template=lab_in.container_template or "linux-basic",
        xp_reward=lab_in.xp_reward or 100,
        time_limit=lab_in.time_limit or 1800
    )
    db.add(new_lab)
    db.commit()
    db.refresh(new_lab)
    return new_lab

@router.put("/labs/{lab_id}")
def update_lab_by_admin(
    lab_id: str,
    lab_in: schemas.AdminLabUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab not found.")

    if lab_in.title is not None:
        lab.title = lab_in.title
    if lab_in.description is not None:
        lab.description = lab_in.description
    if lab_in.type is not None:
        lab.type = lab_in.type
    if lab_in.difficulty is not None:
        lab.difficulty = lab_in.difficulty
    if lab_in.container_template is not None:
        lab.container_template = lab_in.container_template
    if lab_in.xp_reward is not None:
        lab.xp_reward = lab_in.xp_reward
    if lab_in.time_limit is not None:
        lab.time_limit = lab_in.time_limit

    db.commit()
    db.refresh(lab)
    return lab

@router.delete("/labs/{lab_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lab_by_admin(
    lab_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab not found.")

    db.query(models.LabSession).filter(models.LabSession.lab_id == lab_id).delete()

    db.delete(lab)
    db.commit()
    return None

@router.get("/lab-sessions")
def get_admin_lab_sessions(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    query = db.query(models.LabSession).options(
        joinedload(models.LabSession.user),
        joinedload(models.LabSession.lab)
    )
    if status_filter:
        query = query.filter(models.LabSession.status == status_filter)
    sessions = query.order_by(models.LabSession.started_at.desc()).limit(100).all()

    results = []
    for s in sessions:
        results.append({
            "id": s.id,
            "user_id": s.user_id,
            "user_name": s.user.full_name or s.user.username if s.user else "Learner",
            "user_email": s.user.email if s.user else "N/A",
            "lab_id": s.lab_id,
            "lab_title": s.lab.title if s.lab else "Hands-on Lab",
            "container_id": s.container_id,
            "status": s.status,
            "started_at": s.started_at,
            "expires_at": s.expires_at,
            "completed_at": s.completed_at
        })
    return results

@router.post("/lab-sessions/{session_id}/terminate")
def terminate_lab_session_by_admin(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    session = db.query(models.LabSession).filter(models.LabSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab session not found.")

    session.status = "stopped"
    session.completed_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "success", "message": f"Sandbox session {session_id} terminated successfully."}


# ==========================================
# 8. Certificate Minting & Revocation
# ==========================================

@router.get("/certificates")
def get_admin_certificates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    certs = db.query(models.Certificate).options(
        joinedload(models.Certificate.user),
        joinedload(models.Certificate.course),
        joinedload(models.Certificate.exam)
    ).order_by(models.Certificate.issued_at.desc()).all()

    results = []
    for c in certs:
        target_title = c.exam.title if c.exam else c.course.title if c.course else "Cybersecurity Credential"
        results.append({
            "id": c.id,
            "verification_token": c.verification_token,
            "user_id": c.user_id,
            "student_name": c.user.full_name or c.user.username if c.user else "Student",
            "student_email": c.user.email if c.user else "N/A",
            "title": target_title,
            "course_id": c.course_id,
            "exam_id": c.exam_id,
            "certificate_type": c.certificate_type,
            "score_pct": float(c.score_pct or 100.0),
            "issued_at": c.issued_at,
            "verify_url": f"/verify/{c.verification_token}"
        })
    return results

@router.post("/certificates/issue", status_code=status.HTTP_201_CREATED)
def manually_issue_certificate_by_admin(
    cert_in: schemas.AdminManualCertIssue,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    target_user = db.query(models.User).filter(models.User.id == cert_in.user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found.")

    prefix = "CRED"
    if cert_in.exam_id:
        exam = db.query(models.Exam).filter(models.Exam.id == cert_in.exam_id).first()
        if exam:
            prefix = "".join([w[0] for w in exam.title.split() if w.isalpha()]).upper()[:6]
    elif cert_in.course_id:
        course = db.query(models.Course).filter(models.Course.id == cert_in.course_id).first()
        if course:
            prefix = "".join([w[0] for w in course.title.split() if w.isalpha()]).upper()[:6]

    token = f"CERT-{prefix}-{uuid.uuid4().hex[:8].upper()}"

    new_cert = models.Certificate(
        user_id=target_user.id,
        course_id=cert_in.course_id,
        exam_id=cert_in.exam_id,
        score_pct=cert_in.score_pct or 100.0,
        certificate_type=cert_in.certificate_type or "course_completion",
        verification_token=token,
        issued_at=datetime.now(timezone.utc)
    )
    db.add(new_cert)
    target_user.xp += 1000
    db.commit()
    db.refresh(new_cert)
    return {
        "status": "success",
        "message": f"Successfully minted certificate {token} for {target_user.email}.",
        "certificate_id": new_cert.id,
        "token": token
    }

@router.delete("/certificates/{certificate_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_certificate_by_admin(
    certificate_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    cert = db.query(models.Certificate).filter(
        (models.Certificate.id == certificate_id) | (models.Certificate.verification_token == certificate_id)
    ).first()
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found.")
    db.delete(cert)
    db.commit()
    return None


# ==========================================
# 9. Community & Forum Moderation
# ==========================================

@router.get("/posts")
def get_admin_posts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    posts = db.query(models.Post).options(
        joinedload(models.Post.user),
        joinedload(models.Post.comments).joinedload(models.Comment.user)
    ).order_by(models.Post.created_at.desc()).all()

    results = []
    for p in posts:
        comments_list = []
        for c in (p.comments or []):
            comments_list.append({
                "id": c.id,
                "author": c.user.full_name or c.user.username if c.user else "Learner",
                "author_email": c.user.email if c.user else "N/A",
                "content": c.content,
                "is_solution": c.is_solution,
                "created_at": c.created_at
            })
        results.append({
            "id": p.id,
            "title": p.title,
            "content": p.content,
            "category": p.category,
            "tags": p.tags,
            "author_name": p.user.full_name or p.user.username if p.user else "Learner",
            "author_email": p.user.email if p.user else "N/A",
            "is_solved": p.is_solved,
            "upvotes": p.upvotes,
            "comment_count": len(comments_list),
            "comments": comments_list,
            "created_at": p.created_at
        })
    return results

@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post_by_admin(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
    db.delete(post)
    db.commit()
    return None

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment_by_admin(
    comment_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
    db.delete(comment)
    db.commit()
    return None


# ==========================================
# 10. Financials & Invoices Control
# ==========================================

@router.get("/financials")
def get_admin_financials(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    invoices = db.query(models.Invoice).all()
    total_revenue = sum(float(i.total_paid or 0) for i in invoices if i.status == "paid")
    refunded_total = sum(float(i.total_paid or 0) for i in invoices if i.status == "refunded")
    
    sub_count = db.query(models.Invoice).filter(models.Invoice.purchase_type == "subscription", models.Invoice.status == "paid").count()
    lifetime_count = db.query(models.Invoice).filter(models.Invoice.purchase_type == "course_lifetime", models.Invoice.status == "paid").count()

    return {
        "gross_revenue": total_revenue,
        "refunded_total": refunded_total,
        "net_revenue": total_revenue - refunded_total,
        "total_invoices": len(invoices),
        "paid_subscriptions_count": sub_count,
        "lifetime_course_purchases_count": lifetime_count,
        "active_promos": [
            {"code": "CYBER2026", "discount": "50%", "description": "50% Off New Year Cyber Special"},
            {"code": "HACKER100", "discount": "100%", "description": "100% Off VIP First Cycle"},
            {"code": "STUDENT20", "discount": "20%", "description": "20% Student Community Discount"},
            {"code": "SPRING25", "discount": "25%", "description": "25% Spring Promotion"},
        ]
    }

@router.get("/invoices")
def get_admin_invoices(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    invoices = db.query(models.Invoice).options(
        joinedload(models.Invoice.user),
        joinedload(models.Invoice.course)
    ).order_by(models.Invoice.created_at.desc()).all()

    results = []
    for inv in invoices:
        item_title = inv.course.title if inv.course else f"{inv.plan_tier.capitalize() if inv.plan_tier else 'Pro'} All-Access"
        results.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "user_id": inv.user_id,
            "user_name": inv.user.full_name or inv.user.username if inv.user else "Customer",
            "user_email": inv.user.email if inv.user else "N/A",
            "item_name": item_title,
            "purchase_type": inv.purchase_type,
            "plan_tier": inv.plan_tier,
            "billing_cycle": inv.billing_cycle,
            "subtotal": float(inv.subtotal or 0),
            "discount_amount": float(inv.discount_amount or 0),
            "total_paid": float(inv.total_paid or 0),
            "payment_method": inv.payment_method,
            "card_brand": inv.card_brand,
            "card_last4": inv.card_last4,
            "promo_code": inv.promo_code,
            "status": inv.status,
            "created_at": inv.created_at
        })
    return results

@router.put("/invoices/{invoice_id}/status")
def update_invoice_status_by_admin(
    invoice_id: str,
    status_in: schemas.AdminInvoiceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    invoice.status = status_in.status
    db.commit()
    db.refresh(invoice)
    return {"status": "success", "invoice_id": invoice.id, "new_status": invoice.status}


