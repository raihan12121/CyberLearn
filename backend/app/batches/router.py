import secrets
import string
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth.dependencies import get_current_user
from jose import jwt
from ..config import settings

router = APIRouter(
    prefix="/batches",
    tags=["Batches & Cohorts"]
)

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

def generate_batch_code() -> str:
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(secrets.choice(chars) for _ in range(5))
    return f"CYBER-B{suffix}"

def seed_default_batches_if_empty(db: Session):
    if db.query(models.Batch).count() == 0:
        # Find instructor or admin
        instructor = db.query(models.User).filter(models.User.role.in_(["admin", "instructor"])).first()
        if not instructor:
            instructor = db.query(models.User).first()

        course = db.query(models.Course).first()

        if instructor:
            b1 = models.Batch(
                name="Cyber Warfare & SOC Analyst Cohort 1",
                batch_code="CYBER-SOC-2026",
                description="Intensive 8-week hands-on training batch covering enterprise SOC operations, network packet forensics, and live incident response drills.",
                instructor_id=instructor.id,
                course_id=course.id if course else None,
                start_date=datetime.now(timezone.utc) + timedelta(days=5),
                end_date=datetime.now(timezone.utc) + timedelta(days=60),
                max_students=40,
                meeting_link="https://meet.google.com/cyb-soc-live",
                schedule_details="Every Saturday & Tuesday at 8:00 PM - 10:00 PM (GMT+6)",
                is_active=True
            )
            b2 = models.Batch(
                name="Ethical Hacking & Bug Bounty Live Batch",
                batch_code="BUG-BOUNTY-01",
                description="Live offensive security cohort focusing on OWASP Top 10 vulnerabilities, API fuzzing, and practical bug hunting methodologies.",
                instructor_id=instructor.id,
                course_id=course.id if course else None,
                start_date=datetime.now(timezone.utc) + timedelta(days=12),
                end_date=datetime.now(timezone.utc) + timedelta(days=70),
                max_students=35,
                meeting_link="https://meet.google.com/sec-bug-live",
                schedule_details="Every Sunday & Wednesday at 7:30 PM - 9:30 PM (GMT+6)",
                is_active=True
            )
            db.add(b1)
            db.add(b2)
            db.commit()

@router.get("", response_model=List[schemas.BatchResponse])
def list_batches(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    seed_default_batches_if_empty(db)
    batches = db.query(models.Batch).filter(models.Batch.is_active == True).order_by(models.Batch.created_at.desc()).all()
    
    result = []
    for b in batches:
        enrolled_count = db.query(models.BatchEnrollment).filter(models.BatchEnrollment.batch_id == b.id).count()
        is_enrolled = False
        if current_user:
            is_enrolled = db.query(models.BatchEnrollment).filter(
                models.BatchEnrollment.batch_id == b.id,
                models.BatchEnrollment.user_id == current_user.id
            ).first() is not None

        result.append(schemas.BatchResponse(
            id=b.id,
            name=b.name,
            batch_code=b.batch_code,
            description=b.description,
            instructor_id=b.instructor_id,
            instructor_name=b.instructor.full_name if b.instructor else "Lead Cyber Instructor",
            course_id=b.course_id,
            course_title=b.course.title if b.course else "All Security Modules",
            start_date=b.start_date,
            end_date=b.end_date,
            max_students=b.max_students,
            meeting_link=b.meeting_link if is_enrolled else None,
            schedule_details=b.schedule_details,
            is_active=b.is_active,
            enrolled_count=enrolled_count,
            is_enrolled=is_enrolled,
            created_at=b.created_at
        ))
    return result

@router.post("", response_model=schemas.BatchResponse, status_code=status.HTTP_201_CREATED)
def create_batch(
    batch_in: schemas.BatchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Only instructors and admins can create batches
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors or administrators can create learning batches."
        )

    batch_code = generate_batch_code()
    # Ensure uniqueness
    while db.query(models.Batch).filter(models.Batch.batch_code == batch_code).first():
        batch_code = generate_batch_code()

    new_batch = models.Batch(
        name=batch_in.name,
        batch_code=batch_code,
        description=batch_in.description,
        instructor_id=current_user.id,
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

    return schemas.BatchResponse(
        id=new_batch.id,
        name=new_batch.name,
        batch_code=new_batch.batch_code,
        description=new_batch.description,
        instructor_id=new_batch.instructor_id,
        instructor_name=current_user.full_name or current_user.username or "Instructor",
        course_id=new_batch.course_id,
        course_title=new_batch.course.title if new_batch.course else None,
        start_date=new_batch.start_date,
        end_date=new_batch.end_date,
        max_students=new_batch.max_students,
        meeting_link=new_batch.meeting_link,
        schedule_details=new_batch.schedule_details,
        is_active=new_batch.is_active,
        enrolled_count=0,
        is_enrolled=False,
        created_at=new_batch.created_at
    )

@router.get("/my", response_model=List[schemas.BatchResponse])
def get_my_batches(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Enrolled batches or instructed batches
    enrollments = db.query(models.BatchEnrollment).filter(models.BatchEnrollment.user_id == current_user.id).all()
    enrolled_batch_ids = [e.batch_id for e in enrollments]

    batches = db.query(models.Batch).filter(
        (models.Batch.id.in_(enrolled_batch_ids)) | (models.Batch.instructor_id == current_user.id)
    ).all()

    result = []
    for b in batches:
        enrolled_count = db.query(models.BatchEnrollment).filter(models.BatchEnrollment.batch_id == b.id).count()
        result.append(schemas.BatchResponse(
            id=b.id,
            name=b.name,
            batch_code=b.batch_code,
            description=b.description,
            instructor_id=b.instructor_id,
            instructor_name=b.instructor.full_name if b.instructor else "Instructor",
            course_id=b.course_id,
            course_title=b.course.title if b.course else "All Security Modules",
            start_date=b.start_date,
            end_date=b.end_date,
            max_students=b.max_students,
            meeting_link=b.meeting_link,
            schedule_details=b.schedule_details,
            is_active=b.is_active,
            enrolled_count=enrolled_count,
            is_enrolled=True,
            created_at=b.created_at
        ))
    return result

@router.get("/{batch_code_or_id}", response_model=schemas.BatchDetailResponse)
def get_batch_by_code_or_id(
    batch_code_or_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    batch = db.query(models.Batch).filter(
        (models.Batch.batch_code == batch_code_or_id) | (models.Batch.id == batch_code_or_id)
    ).first()

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch '{batch_code_or_id}' was not found."
        )

    enrolled_count = db.query(models.BatchEnrollment).filter(models.BatchEnrollment.batch_id == batch.id).count()
    is_enrolled = False
    if current_user:
        is_enrolled = db.query(models.BatchEnrollment).filter(
            models.BatchEnrollment.batch_id == batch.id,
            models.BatchEnrollment.user_id == current_user.id
        ).first() is not None or (batch.instructor_id == current_user.id)

    # Fetch students enrolled
    enrollments = db.query(models.BatchEnrollment).filter(models.BatchEnrollment.batch_id == batch.id).all()
    students_list = []
    for enr in enrollments:
        if enr.user:
            students_list.append({
                "id": enr.user.id,
                "full_name": enr.user.full_name or enr.user.username or "Student",
                "avatar_url": enr.user.avatar_url,
                "xp": enr.user.xp,
                "enrolled_at": enr.enrolled_at.strftime("%B %d, %Y") if enr.enrolled_at else ""
            })

    return schemas.BatchDetailResponse(
        id=batch.id,
        name=batch.name,
        batch_code=batch.batch_code,
        description=batch.description,
        instructor_id=batch.instructor_id,
        instructor_name=batch.instructor.full_name if batch.instructor else "Lead Instructor",
        course_id=batch.course_id,
        course_title=batch.course.title if batch.course else "All Modules",
        start_date=batch.start_date,
        end_date=batch.end_date,
        max_students=batch.max_students,
        meeting_link=batch.meeting_link if is_enrolled else None,
        schedule_details=batch.schedule_details,
        is_active=batch.is_active,
        enrolled_count=enrolled_count,
        is_enrolled=is_enrolled,
        created_at=batch.created_at,
        students=students_list
    )

@router.post("/{batch_code_or_id}/join")
def join_batch(
    batch_code_or_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    batch = db.query(models.Batch).filter(
        (models.Batch.batch_code == batch_code_or_id) | (models.Batch.id == batch_code_or_id)
    ).first()

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found."
        )

    if not batch.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This batch is currently not active for registration."
        )

    # Check duplicate enrollment
    existing = db.query(models.BatchEnrollment).filter(
        models.BatchEnrollment.batch_id == batch.id,
        models.BatchEnrollment.user_id == current_user.id
    ).first()

    if existing:
        return {
            "status": "already_enrolled",
            "message": "You are already enrolled in this batch!",
            "batch_code": batch.batch_code
        }

    # Check capacity
    current_count = db.query(models.BatchEnrollment).filter(models.BatchEnrollment.batch_id == batch.id).count()
    if current_count >= batch.max_students:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This batch has reached its maximum student capacity."
        )

    enrollment = models.BatchEnrollment(
        batch_id=batch.id,
        user_id=current_user.id,
        status="enrolled",
        enrolled_at=datetime.now(timezone.utc)
    )
    db.add(enrollment)
    db.commit()

    return {
        "status": "success",
        "message": f"Successfully enrolled in {batch.name}!",
        "batch_code": batch.batch_code,
        "meeting_link": batch.meeting_link
    }
