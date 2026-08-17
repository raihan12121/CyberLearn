import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth.dependencies import get_current_user

router = APIRouter(
    prefix="/exams",
    tags=["Exams & Assessments"]
)

def seed_default_exams_if_empty(db: Session):
    from ..courses.router import seed_database_if_empty
    seed_database_if_empty(db)

    exam1 = db.query(models.Exam).filter(models.Exam.id == "exam-web-security-cert").first()
    if not exam1:
        web_course = db.query(models.Course).filter(models.Course.id == "web-security-fundamentals").first()
        if web_course:
            exam1 = models.Exam(
                id="exam-web-security-cert",
                course_id=web_course.id,
                title="Web Application Security Certified Specialist (WASCS) Exam",
                description="Comprehensive 30-minute certification exam covering Same-Origin Policy, XSS vectors, SQL Injection mitigation, and secure session management.",
                duration_minutes=25,
                passing_score_pct=70,
                total_marks=100,
                is_published=True
            )
            db.add(exam1)
            db.flush()

    if exam1 and db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam1.id).count() == 0:
        questions1 = [
            models.ExamQuestion(
                exam_id=exam1.id,
                question_text="Which combination of properties defines an 'Origin' under the browser Same-Origin Policy (SOP)?",
                question_type="mcq",
                options=["Protocol (Scheme), Host Domain, and Port", "Top-level domain and IP Address only", "HTTP Method, Path, and Query String", "Cookie Domain and SSL Certificate fingerprint"],
                correct_answer="0",
                explanation="An origin is defined strictly by Scheme (e.g., https), Host (e.g., cyberlearn.io), and Port (e.g., 443).",
                points=20,
                sort_order=1
            ),
            models.ExamQuestion(
                exam_id=exam1.id,
                question_text="What is the most secure and robust defense mechanism against SQL Injection in modern web backends?",
                question_type="mcq",
                options=["Client-side regex filtering in JavaScript", "Parameterized Queries / Prepared Statements (ORMs)", "Escaping double quotes only with backslashes", "Blacklisting keywords like SELECT and UNION"],
                correct_answer="1",
                explanation="Parameterized queries separate SQL query instructions from untrusted data parameters, completely neutralizing code injection.",
                points=20,
                sort_order=2
            ),
            models.ExamQuestion(
                exam_id=exam1.id,
                question_text="Which HTTP response header is specifically designed to restrict where scripts and resources can be loaded from, mitigating XSS?",
                question_type="mcq",
                options=["Access-Control-Allow-Origin", "Content-Security-Policy (CSP)", "X-Content-Type-Options", "Strict-Transport-Security (HSTS)"],
                correct_answer="1",
                explanation="Content-Security-Policy (CSP) restricts allowed script execution sources and disallows inline executable payloads.",
                points=20,
                sort_order=3
            ),
            models.ExamQuestion(
                exam_id=exam1.id,
                question_text="An attacker tricks an authenticated user into clicking an invisible form that submits a funds transfer. What vulnerability is this?",
                question_type="mcq",
                options=["Cross-Site Scripting (XSS)", "Cross-Site Request Forgery (CSRF)", "Server-Side Request Forgery (SSRF)", "Insecure Deserialization"],
                correct_answer="1",
                explanation="CSRF exploits ambient browser credentials (cookies) to execute unauthorized state-changing actions on behalf of the logged-in user.",
                points=20,
                sort_order=4
            ),
            models.ExamQuestion(
                exam_id=exam1.id,
                question_text="Which flag must be set on a session cookie to prevent client-side JavaScript from accessing it via document.cookie?",
                question_type="mcq",
                options=["Secure", "HttpOnly", "SameSite=Lax", "Domain=.cyberlearn.io"],
                correct_answer="1",
                explanation="The HttpOnly flag blocks client JavaScript access, protecting the session token from XSS cookie-theft.",
                points=20,
                sort_order=5
            ),
        ]
        for q in questions1:
            db.add(q)

    exam2 = db.query(models.Exam).filter(models.Exam.id == "exam-linux-basics-cert").first()
    if not exam2:
        linux_course = db.query(models.Course).filter(models.Course.id == "linux-basics").first()
        if linux_course:
            exam2 = models.Exam(
                id="exam-linux-basics-cert",
                course_id=linux_course.id,
                title="Linux Security & Systems Administration Exam",
                description="Final qualification exam covering Linux permissions, SUID binaries, SSH hardening, and process inspection.",
                duration_minutes=20,
                passing_score_pct=70,
                total_marks=100,
                is_published=True
            )
            db.add(exam2)
            db.flush()

    if exam2 and db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam2.id).count() == 0:
        questions2 = [
            models.ExamQuestion(
                exam_id=exam2.id,
                question_text="Which command finds all executable files in the root filesystem with the SUID bit set?",
                question_type="mcq",
                options=["find / -perm -4000 -type f 2>/dev/null", "ls -la /etc/sudoers.d", "chmod +s /bin/bash", "grep -rn 'suid' /proc"],
                correct_answer="0",
                explanation="The permission octal 4000 identifies files where the SUID special bit is enabled.",
                points=25,
                sort_order=1
            ),
            models.ExamQuestion(
                exam_id=exam2.id,
                question_text="What octal permissions represent read and write for owner, read-only for group, and no permissions for others?",
                question_type="mcq",
                options=["755", "640", "644", "700"],
                correct_answer="1",
                explanation="Owner (rw- = 4+2=6), Group (r-- = 4), Others (--- = 0) -> 640.",
                points=25,
                sort_order=2
            ),
            models.ExamQuestion(
                exam_id=exam2.id,
                question_text="Which SSH configuration option in /etc/ssh/sshd_config completely prevents password brute-forcing?",
                question_type="mcq",
                options=["PasswordAuthentication no", "PermitRootLogin yes", "X11Forwarding yes", "Port 2222"],
                correct_answer="0",
                explanation="Disabling PasswordAuthentication enforces Public Key Authentication only.",
                points=25,
                sort_order=3
            ),
            models.ExamQuestion(
                exam_id=exam2.id,
                question_text="Which virtual filesystem in Linux provides real-time information about running processes and kernel parameters?",
                question_type="mcq",
                options=["/dev", "/proc", "/sys/kernel", "/var/log"],
                correct_answer="1",
                explanation="/proc is a pseudo-filesystem generated on-the-fly containing process and kernel metrics.",
                points=25,
                sort_order=4
            ),
        ]
        for q in questions2:
            db.add(q)

    db.commit()

@router.get("", response_model=List[schemas.ExamResponse])
def list_all_exams(db: Session = Depends(get_db)):
    seed_default_exams_if_empty(db)
    exams = db.query(models.Exam).filter(models.Exam.is_published == True).all()
    result = []
    for ex in exams:
        q_count = db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == ex.id).count()
        result.append(schemas.ExamResponse(
            id=ex.id,
            course_id=ex.course_id,
            title=ex.title,
            description=ex.description,
            duration_minutes=ex.duration_minutes,
            passing_score_pct=ex.passing_score_pct,
            total_marks=ex.total_marks,
            is_published=ex.is_published,
            question_count=q_count,
            created_at=ex.created_at
        ))
    return result

@router.get("/course/{course_id}", response_model=Optional[schemas.ExamDetailResponse])
def get_course_exam(course_id: str, db: Session = Depends(get_db)):
    seed_default_exams_if_empty(db)
    exam = db.query(models.Exam).filter(
        models.Exam.course_id == course_id,
        models.Exam.is_published == True
    ).order_by(models.Exam.created_at.desc()).first()

    if not exam:
        return None

    questions = db.query(models.ExamQuestion).filter(
        models.ExamQuestion.exam_id == exam.id
    ).order_by(models.ExamQuestion.sort_order.asc()).all()

    return schemas.ExamDetailResponse(
        id=exam.id,
        course_id=exam.course_id,
        title=exam.title,
        description=exam.description,
        duration_minutes=exam.duration_minutes,
        passing_score_pct=exam.passing_score_pct,
        total_marks=exam.total_marks,
        is_published=exam.is_published,
        question_count=len(questions),
        created_at=exam.created_at,
        questions=[
            schemas.ExamQuestionPublicResponse(
                id=q.id,
                exam_id=q.exam_id,
                question_text=q.question_text,
                question_type=q.question_type,
                options=q.options or [],
                points=q.points,
                sort_order=q.sort_order
            )
            for q in questions
        ]
    )

@router.get("/{exam_id}", response_model=schemas.ExamDetailResponse)
def get_exam_details(exam_id: str, db: Session = Depends(get_db)):
    seed_default_exams_if_empty(db)
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found."
        )

    questions = db.query(models.ExamQuestion).filter(
        models.ExamQuestion.exam_id == exam.id
    ).order_by(models.ExamQuestion.sort_order.asc()).all()

    return schemas.ExamDetailResponse(
        id=exam.id,
        course_id=exam.course_id,
        title=exam.title,
        description=exam.description,
        duration_minutes=exam.duration_minutes,
        passing_score_pct=exam.passing_score_pct,
        total_marks=exam.total_marks,
        is_published=exam.is_published,
        question_count=len(questions),
        created_at=exam.created_at,
        questions=[
            schemas.ExamQuestionPublicResponse(
                id=q.id,
                exam_id=q.exam_id,
                question_text=q.question_text,
                question_type=q.question_type,
                options=q.options or [],
                points=q.points,
                sort_order=q.sort_order
            )
            for q in questions
        ]
    )

@router.post("/{exam_id}/submit", response_model=schemas.ExamSubmissionResponse)
def submit_exam(
    exam_id: str,
    submission: schemas.ExamSubmitRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found."
        )

    questions = db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam.id).all()
    questions_map = {q.id: q for q in questions}

    total_possible_score = sum(q.points for q in questions) or 100
    user_score = 0
    breakdown = []

    submitted_map = {a.question_id: a.selected_answer for a in submission.answers}

    for q in questions:
        selected = str(submitted_map.get(q.id, "")).strip()
        correct_ans = str(q.correct_answer).strip()
        is_correct = (selected == correct_ans)

        points_earned = q.points if is_correct else 0
        user_score += points_earned

        breakdown.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "selected": selected,
            "correct_answer": correct_ans,
            "is_correct": is_correct,
            "points_earned": points_earned,
            "points_possible": q.points,
            "explanation": q.explanation
        })

    score_pct = round((user_score / total_possible_score) * 100, 2)
    passed = score_pct >= exam.passing_score_pct

    cert_token = None
    if passed:
        # Generate or fetch Certificate
        existing_cert = db.query(models.Certificate).filter(
            models.Certificate.user_id == current_user.id,
            models.Certificate.exam_id == exam.id
        ).first()

        if not existing_cert:
            code_prefix = "".join([w[0] for w in exam.title.split() if w.isalpha()]).upper()[:6]
            cert_token = f"CERT-{code_prefix}-{uuid.uuid4().hex[:8].upper()}"
            
            # Award Exam Passing XP
            xp_bonus = 800
            current_user.xp += xp_bonus

            new_cert = models.Certificate(
                user_id=current_user.id,
                course_id=exam.course_id,
                exam_id=exam.id,
                score_pct=score_pct,
                certificate_type="exam_certified",
                verification_token=cert_token,
                issued_at=datetime.now(timezone.utc)
            )
            db.add(new_cert)
        else:
            cert_token = existing_cert.verification_token
            existing_cert.score_pct = max(float(existing_cert.score_pct or 0), score_pct)

    # Save Exam Submission Record
    db_submission = models.ExamSubmission(
        exam_id=exam.id,
        user_id=current_user.id,
        score=user_score,
        total_score=total_possible_score,
        score_pct=score_pct,
        passed=passed,
        answers=submitted_map,
        certificate_token=cert_token,
        submitted_at=datetime.now(timezone.utc)
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)

    return schemas.ExamSubmissionResponse(
        id=db_submission.id,
        exam_id=exam.id,
        user_id=current_user.id,
        score=float(user_score),
        total_score=float(total_possible_score),
        score_pct=float(score_pct),
        passed=passed,
        certificate_token=cert_token,
        submitted_at=db_submission.submitted_at,
        breakdown=breakdown
    )

@router.get("/submissions/my")
def get_my_exam_submissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    submissions = db.query(models.ExamSubmission).filter(
        models.ExamSubmission.user_id == current_user.id
    ).order_by(models.ExamSubmission.submitted_at.desc()).all()

    result = []
    for s in submissions:
        result.append({
            "id": s.id,
            "exam_id": s.exam_id,
            "exam_title": s.exam.title if s.exam else "Exam",
            "score": float(s.score),
            "total_score": float(s.total_score),
            "score_pct": float(s.score_pct),
            "passed": s.passed,
            "certificate_token": s.certificate_token,
            "submitted_at": s.submitted_at.strftime("%B %d, %Y %I:%M %p")
        })
    return result
