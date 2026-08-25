import sys
import os

backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, engine
from app import models

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("RUNNING EXAM & COURSE COMPLETION DATA PERSISTENCE TESTS")
    print("=" * 60)

    # 1. Register test user
    email = "persistence_student@cyberlearn.io"
    password = "Password123!"
    reg_res = client.post("/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Persistence Student",
        "username": "persistencestudent"
    })
    if reg_res.status_code == 200:
        token = reg_res.json()["access_token"]
    else:
        login_res = client.post("/auth/login", json={"email": email, "password": password})
        token = login_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    print("[1] Test User Authenticated.")

    # 2. Grant all-access subscription and verify ID to test course completion
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.email == email).first()
    user.subscription_tier = "pro"
    user.subscription_status = "active"
    user.verification_status = "verified"
    db.commit()
    user_id = user.id
    db.close()
    print("[2] Pro Subscription & Verified ID Granted.")

    # 3. Test Course Progress Storage
    course_id = "web-security-fundamentals"
    db = SessionLocal()
    lessons = db.query(models.Lesson).filter(models.Lesson.course_id == course_id).order_by(models.Lesson.sort_order).all()
    lesson_ids = [l.id for l in lessons]
    db.close()

    print(f"[3] Completing all {len(lesson_ids)} lessons for course '{course_id}'...")
    for lid in lesson_ids:
        prog_res = client.post("/courses/progress", json={
            "course_id": course_id,
            "lesson_id": lid,
            "status": "completed",
            "completion_pct": 100.0
        }, headers=headers)
        assert prog_res.status_code == 200, f"Progress update failed: {prog_res.text}"

    # 4. Verify Progress and Course Completion Certificate in DB
    db = SessionLocal()
    progress_records = db.query(models.Progress).filter(
        models.Progress.user_id == user_id,
        models.Progress.course_id == course_id
    ).all()
    assert len(progress_records) == len(lesson_ids), f"Expected {len(lesson_ids)} progress records, found {len(progress_records)}"
    print(f"  -> SUCCESS: All {len(progress_records)} lesson progress records stored in database.")

    course_cert = db.query(models.Certificate).filter(
        models.Certificate.user_id == user_id,
        models.Certificate.course_id == course_id,
        models.Certificate.certificate_type == "course_completion"
    ).first()
    assert course_cert is not None, "Course completion certificate was not automatically stored!"
    course_cert_token = course_cert.verification_token
    print(f"  -> SUCCESS: Course completion certificate generated & stored: {course_cert_token}")
    db.close()

    # 5. Test Exam Submission & Data Storage
    exam_id = "exam-comptia-secplus"
    print(f"[4] Taking and Submitting Professional Exam '{exam_id}'...")
    
    exam_detail_res = client.get(f"/exams/{exam_id}")
    assert exam_detail_res.status_code == 200, f"Exam fetch failed: {exam_detail_res.text}"
    exam_data = exam_detail_res.json()
    questions = exam_data["questions"]

    # Submit passing answers
    db = SessionLocal()
    db_questions = db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam_id).all()
    correct_answers = [{"question_id": q.id, "selected_answer": str(q.correct_answer)} for q in db_questions]
    db.close()

    submit_res = client.post(f"/exams/{exam_id}/submit", json={"answers": correct_answers}, headers=headers)
    assert submit_res.status_code == 200, f"Exam submit failed: {submit_res.text}"
    submit_json = submit_res.json()
    assert submit_json["passed"] is True
    assert submit_json["score_pct"] == 100.0
    exam_cert_token = submit_json["certificate_token"]
    assert exam_cert_token is not None, "Certificate token was not returned on passing exam!"
    print(f"  -> SUCCESS: Exam passed 100%. Minted Token: {exam_cert_token}")

    # 6. Verify Exam Submission & Exam Certificate in DB
    db = SessionLocal()
    exam_sub = db.query(models.ExamSubmission).filter(
        models.ExamSubmission.user_id == user_id,
        models.ExamSubmission.exam_id == exam_id
    ).first()
    assert exam_sub is not None, "Exam submission record was not stored in database!"
    assert float(exam_sub.score_pct) == 100.0
    assert exam_sub.passed is True
    assert exam_sub.certificate_token == exam_cert_token
    print(f"  -> SUCCESS: ExamSubmission stored in DB with ID: {exam_sub.id}, score: {exam_sub.score}/{exam_sub.total_score}")

    exam_cert = db.query(models.Certificate).filter(
        models.Certificate.user_id == user_id,
        models.Certificate.exam_id == exam_id,
        models.Certificate.certificate_type == "exam_certified"
    ).first()
    assert exam_cert is not None, "Exam certificate was not stored in database!"
    assert exam_cert.verification_token == exam_cert_token
    print(f"  -> SUCCESS: Certificate stored in DB with verification_token: {exam_cert.verification_token}")
    db.close()

    # 7. Verify GET /exams/submissions/my
    my_subs_res = client.get("/exams/submissions/my", headers=headers)
    assert my_subs_res.status_code == 200
    my_subs = my_subs_res.json()
    assert len(my_subs) >= 1
    assert any(s["exam_id"] == exam_id for s in my_subs)
    print(f"[5] GET /exams/submissions/my retrieved {len(my_subs)} stored user submissions.")

    # 8. Verify GET /certificates
    certs_res = client.get("/certificates", headers=headers)
    assert certs_res.status_code == 200
    all_certs = certs_res.json()
    issued_certs = [c for c in all_certs if c["status"] == "issued"]
    assert len(issued_certs) >= 2, f"Expected at least 2 issued certificates (1 course + 1 exam), found {len(issued_certs)}"
    print(f"[6] GET /certificates retrieved {len(issued_certs)} issued certificates:")
    for ic in issued_certs:
        print(f"    - {ic['courseTitle']} ({ic['certificateType']}): {ic['id']} [Score: {ic['scorePct']}%]")

    # 9. Verify Public Verification for both certificates
    for token_to_verify in [course_cert_token, exam_cert_token]:
        v_res = client.get(f"/certificates/verify/{token_to_verify}")
        assert v_res.status_code == 200
        v_data = v_res.json()
        assert v_data["valid"] is True
        print(f"[7] Public verification verified token: {token_to_verify} -> '{v_data['course_title']}' for {v_data['student_name']}")

    # 10. Verify Public Portfolio
    profile_res = client.get("/users/persistencestudent/public-profile")
    assert profile_res.status_code == 200
    profile_data = profile_res.json()
    assert len(profile_data["certificates"]) >= 2
    print(f"[8] Public profile at /portfolio/persistencestudent showcases {len(profile_data['certificates'])} verified certificates.")

    print("=" * 60)
    print("ALL EXAM & COURSE DATA STORAGE TESTS PASSED SUCCESSFULLY (100%)")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
