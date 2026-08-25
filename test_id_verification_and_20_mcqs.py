import sys
import os

backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app import models

client = TestClient(app)

def run_tests():
    print("=" * 65)
    print("RUNNING ID VERIFICATION & 20-25 MCQs COMPREHENSIVE TEST SUITE")
    print("=" * 65)

    # -------------------------------------------------------------
    # 1. VERIFY 20-25 MCQs PER EXAM
    # -------------------------------------------------------------
    print("[1] Verifying 20-25 MCQ Questions for All 5 Certification Exams...")
    exams_res = client.get("/exams")
    assert exams_res.status_code == 200
    exams = exams_res.json()
    assert len(exams) >= 5, f"Expected 5 exams, got {len(exams)}"

    expected_exam_ids = [
        "exam-web-security-cert",
        "exam-linux-basics-cert",
        "exam-ccna-security",
        "exam-comptia-secplus",
        "exam-ceh-associate",
    ]

    for ex_id in expected_exam_ids:
        detail_res = client.get(f"/exams/{ex_id}")
        assert detail_res.status_code == 200, f"Failed to get exam {ex_id}"
        ex_data = detail_res.json()
        q_count = len(ex_data["questions"])
        print(f"  -> Exam '{ex_data['title']}': {q_count} questions configured.")
        assert q_count >= 20, f"Exam {ex_id} has only {q_count} questions (Expected >= 20)!"
        
        # Verify each question has text, options, and points
        for q in ex_data["questions"]:
            assert len(q["options"]) >= 4, f"Question {q['id']} has less than 4 options"
            assert len(q["question_text"]) > 10, f"Question {q['id']} has invalid text"

    print("  -> SUCCESS: All 5 professional certification exams contain 20+ comprehensive MCQs!\n")

    # -------------------------------------------------------------
    # 2. VERIFY MANDATORY ID VERIFICATION RULE FOR CERTIFICATES
    # -------------------------------------------------------------
    print("[2] Testing Mandatory ID Verification Rule for Certificate Issuance...")
    
    # Register a new unverified student
    email = "unverified_learner@cyberlearn.io"
    password = "Password123!"
    reg_res = client.post("/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Unverified Learner",
        "username": "unverifiedlearner"
    })
    token = reg_res.json()["access_token"] if reg_res.status_code == 200 else client.post("/auth/login", json={"email": email, "password": password}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Grant Pro subscription to allow course access
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.email == email).first()
    user.subscription_tier = "pro"
    user.subscription_status = "active"
    user.verification_status = "unverified"
    db.commit()
    user_id = user.id
    db.close()

    # Step A: Take Exam while UNVERIFIED
    exam_id = "exam-ccna-security"
    db = SessionLocal()
    db_questions = db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam_id).all()
    correct_answers = [{"question_id": q.id, "selected_answer": str(q.correct_answer)} for q in db_questions]
    db.close()

    print(f"  -> Submitting 20 questions for CCNA Security Exam while ID status is 'unverified'...")
    submit_res = client.post(f"/exams/{exam_id}/submit", json={"answers": correct_answers}, headers=headers)
    assert submit_res.status_code == 200
    submit_data = submit_res.json()
    
    assert submit_data["passed"] is True
    assert submit_data["score_pct"] == 100.0
    # RULE CHECK: Certificate token MUST BE NONE because user is not ID verified!
    assert submit_data["certificate_token"] is None, "CRITICAL: Certificate was issued to an unverified user!"
    print("  -> SUCCESS: Exam passed 100%, but certificate token was held/blocked due to missing ID verification.")

    # Step B: Complete Course while UNVERIFIED
    course_id = "web-security-fundamentals"
    db = SessionLocal()
    lessons = db.query(models.Lesson).filter(models.Lesson.course_id == course_id).all()
    for l in lessons:
        client.post("/courses/progress", json={
            "course_id": course_id,
            "lesson_id": l.id,
            "status": "completed",
            "completion_pct": 100.0
        }, headers=headers)
    
    # Check that Certificate table does NOT contain course cert yet
    course_cert_unverified = db.query(models.Certificate).filter(
        models.Certificate.user_id == user_id,
        models.Certificate.course_id == course_id
    ).first()
    assert course_cert_unverified is None, "CRITICAL: Course certificate was minted without ID verification!"
    db.close()
    print("  -> SUCCESS: Course completed 100%, but course certificate held pending ID verification.")

    # Step C: Check GET /certificates while UNVERIFIED
    certs_res = client.get("/certificates", headers=headers)
    assert certs_res.status_code == 200
    certs_list = certs_res.json()
    pending_certs = [c for c in certs_list if c.get("status") == "verification_required"]
    assert len(pending_certs) >= 2, f"Expected 2 pending ID verification certificates, found {len(pending_certs)}"
    print(f"  -> SUCCESS: GET /certificates displays {len(pending_certs)} credentials with status 'verification_required'.")

    # -------------------------------------------------------------
    # 3. COMPLETE ID VERIFICATION & VERIFY RETROACTIVE UNLOCK
    # -------------------------------------------------------------
    print("\n[3] Completing Government National ID Verification (NID)...")
    nid_res = client.post("/users/me/verify-nid", json={
        "nid_number": "8923471092",
        "nid_front_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "nid_back_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }, headers=headers)
    assert nid_res.status_code == 200
    nid_data = nid_res.json()
    assert nid_data["verification_status"] == "verified"
    print("  -> SUCCESS: Government ID verified successfully!")

    # Step D: Verify that all pending certificates are now unlocked and minted!
    certs_unlocked_res = client.get("/certificates", headers=headers)
    assert certs_unlocked_res.status_code == 200
    unlocked_certs = [c for c in certs_unlocked_res.json() if c.get("status") == "issued"]
    assert len(unlocked_certs) >= 2, f"Expected at least 2 newly minted certificates, found {len(unlocked_certs)}"
    
    print(f"  -> SUCCESS: Retroactive minting unlocked {len(unlocked_certs)} official credentials:")
    for uc in unlocked_certs:
        print(f"      * {uc['courseTitle']} ({uc['certificateType']}): {uc['id']} [Score: {uc['scorePct']}%]")
        
        # Test Public Verification Endpoint
        v_res = client.get(f"/certificates/verify/{uc['id']}")
        assert v_res.status_code == 200
        assert v_res.json()["valid"] is True

    print("\n" + "=" * 65)
    print("ALL MANDATORY ID VERIFICATION & 20-25 MCQ TESTS PASSED (100%)")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()
