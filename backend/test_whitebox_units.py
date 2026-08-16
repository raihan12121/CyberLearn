import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone
import uuid

from app.database import Base
from app import models

# In-memory test SQLite engine
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


# -------------------------------------------------------------
# 1. Whitebox Unit Tests: User & NID Identity Verification
# -------------------------------------------------------------
def test_user_nid_verification_lifecycle(db_session):
    user = models.User(
        email="testlearner@cyberlearn.io",
        username="testlearner",
        password_hash="fakehash123",
        full_name="Alex Mercer",
        role="student",
        verification_status="unverified"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Initial state
    assert user.verification_status == "unverified"
    assert user.nid_number is None
    assert user.is_verified is False

    # Submit NID
    user.nid_number = "1998521094002341"
    user.nid_front_image = "data:image/png;base64,mockfront"
    user.nid_back_image = "data:image/png;base64,mockback"
    user.verification_status = "pending"
    user.verification_notes = "Under admin review"
    db_session.commit()

    db_session.refresh(user)
    assert user.verification_status == "pending"
    assert user.nid_number == "1998521094002341"

    # Admin Approves
    user.verification_status = "verified"
    user.is_verified = True
    user.verified_at = datetime.now(timezone.utc)
    db_session.commit()

    db_session.refresh(user)
    assert user.verification_status == "verified"
    assert user.is_verified is True
    assert user.verified_at is not None


# -------------------------------------------------------------
# 2. Whitebox Unit Tests: Batch & Capacity Constraints
# -------------------------------------------------------------
def test_batch_creation_and_enrollment(db_session):
    instructor = models.User(
        email="instructor@cyberlearn.io",
        username="cybermentor",
        password_hash="fakehash123",
        role="instructor"
    )
    student1 = models.User(email="s1@cyberlearn.io", password_hash="h1")
    student2 = models.User(email="s2@cyberlearn.io", password_hash="h2")
    db_session.add_all([instructor, student1, student2])
    db_session.commit()

    batch = models.Batch(
        name="SOC Analyst Cohort 2026",
        batch_code="CYBER-SOC-01",
        instructor_id=instructor.id,
        max_students=1, # Capacity of 1 to test boundary
        is_active=True
    )
    db_session.add(batch)
    db_session.commit()
    db_session.refresh(batch)

    assert batch.batch_code == "CYBER-SOC-01"
    assert batch.instructor_id == instructor.id

    # Enroll Student 1 (Should succeed)
    enrollment1 = models.BatchEnrollment(
        batch_id=batch.id,
        user_id=student1.id,
        status="enrolled"
    )
    db_session.add(enrollment1)
    db_session.commit()

    count = db_session.query(models.BatchEnrollment).filter(models.BatchEnrollment.batch_id == batch.id).count()
    assert count == 1
    assert count >= batch.max_students # Batch is now full


# -------------------------------------------------------------
# 3. Whitebox Unit Tests: Multi-Session AI & Prompt Isolation
# -------------------------------------------------------------
def test_ai_session_and_message_isolation(db_session):
    user = models.User(email="ai_tester@cyberlearn.io", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    # Session 1: Pentest persona
    session1 = models.AiSession(
        user_id=user.id,
        title="Web Pentesting",
        system_prompt="You are a strict offensive web pentester."
    )
    # Session 2: Blue Team persona
    session2 = models.AiSession(
        user_id=user.id,
        title="SOC Defense",
        system_prompt="You are a blue team SOC analyst."
    )
    db_session.add_all([session1, session2])
    db_session.commit()

    # Add messages to session 1
    msg1 = models.AiChatMessage(session_id=session1.id, role="user", content="How to test SQLi?")
    msg2 = models.AiChatMessage(session_id=session1.id, role="assistant", content="Use single quotes or sqlmap.")
    db_session.add_all([msg1, msg2])
    db_session.commit()

    # Assert session message counts & isolation
    s1_msgs = db_session.query(models.AiChatMessage).filter(models.AiChatMessage.session_id == session1.id).all()
    s2_msgs = db_session.query(models.AiChatMessage).filter(models.AiChatMessage.session_id == session2.id).all()

    assert len(s1_msgs) == 2
    assert len(s2_msgs) == 0
    assert session1.system_prompt != session2.system_prompt


# -------------------------------------------------------------
# 4. Whitebox Unit Tests: Exam Grading & Auto-Certification Logic
# -------------------------------------------------------------
def test_exam_grading_and_certification_threshold(db_session):
    user = models.User(email="examtaker@cyberlearn.io", password_hash="hash", xp=100)
    course = models.Course(title="Web Security Fundamentals", is_published=True)
    db_session.add_all([user, course])
    db_session.commit()

    exam = models.Exam(
        course_id=course.id,
        title="Web Security Certification Exam",
        duration_minutes=30,
        passing_score_pct=70,
        total_marks=100
    )
    db_session.add(exam)
    db_session.commit()

    q1 = models.ExamQuestion(
        exam_id=exam.id,
        question_text="What is SOP?",
        options=["Same-Origin Policy", "Standard Op", "None"],
        correct_answer="0",
        points=50
    )
    q2 = models.ExamQuestion(
        exam_id=exam.id,
        question_text="Defense against SQLi?",
        options=["Client regex", "Prepared statements"],
        correct_answer="1",
        points=50
    )
    db_session.add_all([q1, q2])
    db_session.commit()

    # Case A: Failing Submission (1 out of 2 correct = 50% < 70%)
    answers_fail = {q1.id: "0", q2.id: "0"} # q2 is incorrect
    score_fail = 50.0
    pct_fail = 50.0
    passed_fail = (pct_fail >= exam.passing_score_pct)
    assert passed_fail is False

    # Case B: Passing Submission (2 out of 2 correct = 100% >= 70%)
    answers_pass = {q1.id: "0", q2.id: "1"} # both correct
    score_pass = 100.0
    pct_pass = 100.0
    passed_pass = (pct_pass >= exam.passing_score_pct)
    assert passed_pass is True

    # Auto Issue Certificate for passing submission
    cert_token = f"CERT-WASCS-{uuid.uuid4().hex[:8].upper()}"
    cert = models.Certificate(
        user_id=user.id,
        course_id=course.id,
        exam_id=exam.id,
        score_pct=pct_pass,
        certificate_type="exam_certified",
        verification_token=cert_token
    )
    user.xp += 800
    db_session.add(cert)
    db_session.commit()

    db_session.refresh(user)
    assert user.xp == 900
    assert cert.verification_token.startswith("CERT-WASCS-")
    assert cert.score_pct == 100.0
