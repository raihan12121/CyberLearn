import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, get_db
from app import models
import secrets

client = TestClient(app)

def create_authenticated_user(email: str, role: str = "student") -> tuple:
    """Helper to create a user and return auth headers."""
    reg_payload = {
        "email": email,
        "password": "Password123!",
        "full_name": f"Test {role.capitalize()}",
        "username": email.split("@")[0]
    }
    # Register
    client.post("/auth/register", json=reg_payload)
    
    # Update role and verification directly in DB if needed
    from app.database import SessionLocal
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.email == email).first()
    user_id = user.id if user else None
    if user:
        user.is_verified = True
        user.verification_status = "verified"
        user.subscription_status = "active"
        user.subscription_tier = "pro"
        user.role = role
        db.commit()
    db.close()

    # Login
    login_res = client.post("/auth/login", json={"email": email, "password": "Password123!"})
    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    return user_id, headers


# -------------------------------------------------------------
# Blackbox Workflow 1: NID Submission & Admin Review
# -------------------------------------------------------------
def test_blackbox_nid_verification_flow():
    rand_suffix = secrets.token_hex(4)
    student_email = f"student_{rand_suffix}@cyberlearn.io"
    admin_email = f"admin_{rand_suffix}@cyberlearn.io"

    student_id, student_headers = create_authenticated_user(student_email, role="student")
    admin_id, admin_headers = create_authenticated_user(admin_email, role="admin")

    # Reset student to unverified so submission transitions from unverified to pending
    from app.database import SessionLocal
    db = SessionLocal()
    st_u = db.query(models.User).filter(models.User.id == student_id).first()
    st_u.verification_status = "unverified"
    st_u.is_verified = False
    st_u.verified_at = None
    db.commit()
    db.close()

    # 1. Student submits NID
    nid_payload = {
        "nid_number": "1994502391004123",
        "nid_front_image": "data:image/png;base64,frontphoto",
        "nid_back_image": "data:image/png;base64,backphoto"
    }
    submit_res = client.post("/users/me/verify-nid", json=nid_payload, headers=student_headers)
    assert submit_res.status_code == 200
    assert submit_res.json()["verification_status"] == "pending"
    assert submit_res.json()["nid_number"] == "1994502391004123"

    # 2. Admin inspects pending list
    admin_list_res = client.get("/admin/verifications", headers=admin_headers)
    assert admin_list_res.status_code == 200
    submissions = admin_list_res.json()
    assert any(s["user_id"] == student_id for s in submissions)

    # 3. Admin reviews and approves NID
    review_payload = {
        "status": "verified",
        "notes": "Verified National ID against official records."
    }
    review_res = client.post(f"/admin/verifications/{student_id}/review", json=review_payload, headers=admin_headers)
    assert review_res.status_code == 200
    assert review_res.json()["verification_status"] == "verified"

    # 4. Student checks profile status
    status_res = client.get("/users/me/verify-nid", headers=student_headers)
    assert status_res.status_code == 200
    assert status_res.json()["verification_status"] == "verified"


# -------------------------------------------------------------
# Blackbox Workflow 2: Batch Creation, Shareable Link & Joining
# -------------------------------------------------------------
def test_blackbox_batch_cohort_flow():
    rand_suffix = secrets.token_hex(4)
    instructor_email = f"instructor_{rand_suffix}@cyberlearn.io"
    student_email = f"batch_student_{rand_suffix}@cyberlearn.io"

    _, instructor_headers = create_authenticated_user(instructor_email, role="instructor")
    _, student_headers = create_authenticated_user(student_email, role="student")

    # 1. Instructor creates Batch
    batch_payload = {
        "name": f"Advanced Offensive CTF Sprint {rand_suffix}",
        "description": "8-week offensive web and network pentesting cohort.",
        "max_students": 25,
        "schedule_details": "Tuesdays & Thursdays at 8:00 PM GMT+6",
        "meeting_link": "https://meet.google.com/abc-defg-hij"
    }
    create_res = client.post("/batches", json=batch_payload, headers=instructor_headers)
    assert create_res.status_code == 201
    batch_data = create_res.json()
    batch_code = batch_data["batch_code"]
    assert batch_code is not None

    # 2. View Batch via Shareable Link (public/student view)
    view_res = client.get(f"/batches/{batch_code}", headers=student_headers)
    assert view_res.status_code == 200
    assert view_res.json()["batch_code"] == batch_code
    assert view_res.json()["is_enrolled"] is False

    # 3. Student Enrolls in Batch
    join_res = client.post(f"/batches/{batch_code}/join", headers=student_headers)
    assert join_res.status_code == 200
    assert join_res.json()["status"] == "success"

    # 4. Re-fetch Batch - student is now enrolled and sees live meeting link
    re_view = client.get(f"/batches/{batch_code}", headers=student_headers)
    assert re_view.status_code == 200
    assert re_view.json()["is_enrolled"] is True
    assert re_view.json()["meeting_link"] == "https://meet.google.com/abc-defg-hij"


# -------------------------------------------------------------
# Blackbox Workflow 3: Multi-Session AI with Custom System Prompts
# -------------------------------------------------------------
def test_blackbox_ai_multi_session_flow():
    rand_suffix = secrets.token_hex(4)
    student_email = f"ai_student_{rand_suffix}@cyberlearn.io"
    _, student_headers = create_authenticated_user(student_email, role="student")

    # 1. Create AI Session with Custom Persona
    session_payload = {
        "title": "Bug Bounty Web Mentor",
        "system_prompt": "You are a Bug Bounty Hacker. Focus on SQLi and SOP."
    }
    create_session_res = client.post("/ai/sessions", json=session_payload, headers=student_headers)
    assert create_session_res.status_code == 201
    session_id = create_session_res.json()["id"]

    # 2. Chat within session
    chat_payload = {
        "message": "Explain Same-Origin Policy in simple terms"
    }
    chat_res = client.post(f"/ai/sessions/{session_id}/chat", json=chat_payload, headers=student_headers)
    assert chat_res.status_code == 200
    assert "reply" in chat_res.json()
    assert len(chat_res.json()["reply"]) > 10

    # 3. Verify session history contains both messages
    detail_res = client.get(f"/ai/sessions/{session_id}", headers=student_headers)
    assert detail_res.status_code == 200
    messages = detail_res.json()["messages"]
    assert len(messages) >= 2
    assert messages[0]["role"] == "user"
    assert messages[1]["role"] == "assistant"


# -------------------------------------------------------------
# Blackbox Workflow 4: Course Exam & Certificate Verification
# -------------------------------------------------------------
def test_blackbox_exam_and_certification_flow():
    rand_suffix = secrets.token_hex(4)
    student_email = f"exam_student_{rand_suffix}@cyberlearn.io"
    _, student_headers = create_authenticated_user(student_email, role="student")

    # 1. Fetch Course Exam for web-security-fundamentals
    exam_res = client.get("/exams/course/web-security-fundamentals")
    assert exam_res.status_code == 200
    exam_data = exam_res.json()
    exam_id = exam_data["id"]
    questions = exam_data["questions"]
    assert len(questions) > 0

    # 2. Submit Exam Answers with valid passing answers
    from app.database import SessionLocal
    db = SessionLocal()
    db_questions = {q.id: q.correct_answer for q in db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam_id).all()}
    db.close()

    answers = []
    for q in questions:
        c_ans = db_questions.get(q["id"], "0")
        answers.append({"question_id": q["id"], "selected_answer": c_ans})

    submit_res = client.post(f"/exams/{exam_id}/submit", json={"answers": answers}, headers=student_headers)
    assert submit_res.status_code == 200
    submission = submit_res.json()
    assert submission["passed"] is True
    assert submission["score_pct"] >= 70.0
    cert_token = submission["certificate_token"]
    assert cert_token is not None

    # 3. Verify Certificate via Public Endpoint
    verify_res = client.get(f"/certificates/verify/{cert_token}")
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "valid"
    assert verify_res.json()["token"] == cert_token
