import os
import sys

# Ensure backend package can be imported
sys.path.insert(0, os.path.abspath("backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User, Course, Lesson, Exam, ExamQuestion, Batch, Lab, Certificate, Invoice
from app.auth.utils import create_access_token, get_password_hash

client = TestClient(app)

def run_tests():
    print("=== Testing Admin Control Center Endpoints ===")
    
    # 1. Setup an admin and a test student user
    from app.database import SessionLocal
    db = SessionLocal()
    
    admin_user = db.query(User).filter(User.email == "admin_test@cyberlearn.io").first()
    if not admin_user:
        admin_user = User(
            email="admin_test@cyberlearn.io",
            username="admin_test",
            full_name="Admin Tester",
            password_hash=get_password_hash("adminpass123"),
            role="admin",
            subscription_tier="premium",
            subscription_status="active",
            is_verified=True,
            verification_status="verified",
            xp=5000,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
    student_user = db.query(User).filter(User.email == "student_test@cyberlearn.io").first()
    if not student_user:
        student_user = User(
            email="student_test@cyberlearn.io",
            username="student_test",
            full_name="Student Tester",
            password_hash=get_password_hash("studentpass123"),
            role="student",
            subscription_tier="free",
            subscription_status="inactive",
            is_verified=False,
            verification_status="pending",
            nid_number="1234567890",
            xp=100,
        )
        db.add(student_user)
        db.commit()
        db.refresh(student_user)

    admin_token = create_access_token(data={"sub": admin_user.email, "role": "admin"})
    student_token = create_access_token(data={"sub": student_user.email, "role": "student"})
    
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # Test 1: Non-admin access denied
    res = client.get("/admin/metrics", headers=student_headers)
    assert res.status_code == 403, f"Expected 403 for student on admin endpoint, got {res.status_code}"
    print("[PASS] Authorization check passed (Student 403 Forbidden)")

    # Test 2: Admin Metrics
    res = client.get("/admin/metrics", headers=admin_headers)
    assert res.status_code == 200, f"Metrics failed: {res.text}"
    data = res.json()
    assert "stats" in data and "summary" in data and "resources" in data
    print("[PASS] GET /admin/metrics passed")

    # Test 3: Users Management CRUD
    res = client.get("/admin/users", headers=admin_headers)
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 2
    print(f"[PASS] GET /admin/users passed ({len(users)} users found)")

    # Create new user via admin
    import uuid
    dynamic_email = f"admin_created_{uuid.uuid4().hex[:6]}@cyberlearn.io"
    res = client.post("/admin/users", headers=admin_headers, json={
        "email": dynamic_email,
        "password": "Password123!",
        "full_name": "Created User",
        "username": f"user_{uuid.uuid4().hex[:6]}",
        "role": "instructor",
        "subscription_tier": "pro",
        "xp": 350,
        "is_verified": True
    })
    assert res.status_code in [200, 201], f"Create user failed: {res.text}"
    created_u = res.json()
    created_id = created_u["id"]
    print(f"[PASS] POST /admin/users passed (Created user ID: {created_id})")

    # Update user
    res = client.put(f"/admin/users/{created_id}", headers=admin_headers, json={
        "role": "admin",
        "subscription_tier": "premium",
        "xp": 999
    })
    assert res.status_code == 200
    assert res.json()["role"] == "admin"
    print("[PASS] PUT /admin/users/{id} passed")

    # Delete user
    res = client.delete(f"/admin/users/{created_id}", headers=admin_headers)
    assert res.status_code in [200, 204]
    print("[PASS] DELETE /admin/users/{id} passed")

    # Test 4: KYC Verification Review
    res = client.get("/admin/verifications", headers=admin_headers)
    assert res.status_code == 200
    print("[PASS] GET /admin/verifications passed")

    res = client.post(f"/admin/verifications/{student_user.id}/review", headers=admin_headers, json={
        "status": "verified",
        "notes": "Valid National ID verified"
    })
    assert res.status_code == 200
    assert res.json()["verification_status"] == "verified"
    print("[PASS] POST /admin/verifications/{user_id}/review passed")

    # Test 5: Courses & Lessons Management
    res = client.get("/admin/courses", headers=admin_headers)
    assert res.status_code in [200, 201]
    print(f"[PASS] GET /admin/courses passed ({len(res.json())} courses found)")

    # Create Course
    course_id = f"course-test-{uuid.uuid4().hex[:6]}"
    res = client.post("/admin/courses", headers=admin_headers, json={
        "id": course_id,
        "title": "Automated Penetration Testing",
        "description": "Master automated toolkits and exploit pipelines",
        "category": "Offensive Security",
        "difficulty": "Advanced",
        "price": 89.0,
        "estimated_duration": 480,
        "is_published": True
    })
    assert res.status_code in [200, 201]
    print("[PASS] POST /admin/courses passed")

    # Add Lesson to Course
    lesson_id = f"lesson-test-{uuid.uuid4().hex[:6]}"
    res = client.post(f"/admin/courses/{course_id}/lessons", headers=admin_headers, json={
        "id": lesson_id,
        "title": "Reconnaissance with Amass & Subfinder",
        "content_type": "video",
        "video_url": "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
        "duration": 25,
        "sort_order": 1,
        "content": "# OSINT Reconnaissance\nTools and methodology overview."
    })
    assert res.status_code in [200, 201]
    created_lesson = res.json()
    print("[PASS] POST /admin/courses/{id}/lessons passed")

    # Get Lessons
    res = client.get(f"/admin/courses/{course_id}/lessons", headers=admin_headers)
    assert res.status_code in [200, 201] and len(res.json()) >= 1
    print("[PASS] GET /admin/courses/{id}/lessons passed")

    # Update Lesson
    res = client.put(f"/admin/lessons/{created_lesson['id']}", headers=admin_headers, json={
        "title": "Reconnaissance with Amass & Subfinder (Updated)",
        "duration": 30
    })
    assert res.status_code in [200, 201] and res.json()["duration"] == 30
    print("[PASS] PUT /admin/lessons/{id} passed")

    # Test 6: Exams & Questions Management
    res = client.get("/admin/exams", headers=admin_headers)
    assert res.status_code in [200, 201]
    print(f"[PASS] GET /admin/exams passed ({len(res.json())} exams found)")

    exam_id = f"exam-test-{uuid.uuid4().hex[:6]}"
    res = client.post("/admin/exams", headers=admin_headers, json={
        "id": exam_id,
        "course_id": course_id,
        "title": "Certified Automated Penetration Tester",
        "description": "Official certification exam",
        "duration_minutes": 60,
        "passing_score_pct": 75,
        "total_marks": 100,
        "is_published": True
    })
    assert res.status_code in [200, 201]
    print("[PASS] POST /admin/exams passed")

    # Add Question to Exam
    res = client.post(f"/admin/exams/{exam_id}/questions", headers=admin_headers, json={
        "question_text": "Which tool is best suited for DNS subdomain enumeration?",
        "question_type": "mcq",
        "options": ["Amass", "Wireshark", "John the Ripper", "Hydra"],
        "correct_answer": "0",
        "explanation": "OWASP Amass performs in-depth DNS subdomain enumeration.",
        "points": 10,
        "sort_order": 1
    })
    assert res.status_code in [200, 201]
    created_q = res.json()
    print("[PASS] POST /admin/exams/{id}/questions passed")

    # Get Exam Questions
    res = client.get(f"/admin/exams/{exam_id}/questions", headers=admin_headers)
    assert res.status_code in [200, 201] and len(res.json()) >= 1
    print("[PASS] GET /admin/exams/{id}/questions passed")

    # Test 7: Batches & Cohort Management
    res = client.get("/admin/batches", headers=admin_headers)
    assert res.status_code in [200, 201]
    print(f"[PASS] GET /admin/batches passed ({len(res.json())} batches found)")

    res = client.post("/admin/batches", headers=admin_headers, json={
        "name": "Live Red Team BootCamp 2026",
        "description": "Intensive weekend live cohort",
        "course_id": course_id,
        "start_date": "2026-09-01T00:00:00Z",
        "end_date": "2026-11-01T00:00:00Z",
        "max_students": 30,
        "meeting_link": "https://meet.google.com/abc-defg-hij",
        "schedule_details": "Saturdays 8:00 PM EST",
        "is_active": True
    })
    assert res.status_code in [200, 201]
    created_batch = res.json()
    batch_id = created_batch["id"]
    print(f"[PASS] POST /admin/batches passed (Batch code: {created_batch['batch_code']})")

    # Enroll Student into Batch via Admin
    res = client.post(f"/admin/batches/{batch_id}/enroll", headers=admin_headers, json={
        "user_id": student_user.id
    })
    assert res.status_code in [200, 201]
    print("[PASS] POST /admin/batches/{id}/enroll passed")

    res = client.get(f"/admin/batches/{batch_id}/students", headers=admin_headers)
    assert res.status_code in [200, 201] and len(res.json()) >= 1
    print("[PASS] GET /admin/batches/{id}/students passed")

    # Test 8: Labs & Sandboxes Management
    res = client.get("/admin/labs", headers=admin_headers)
    assert res.status_code in [200, 201]
    print(f"[PASS] GET /admin/labs passed ({len(res.json())} labs found)")

    res = client.get("/admin/lab-sessions", headers=admin_headers)
    assert res.status_code in [200, 201]
    print(f"[PASS] GET /admin/lab-sessions passed ({len(res.json())} sessions found)")

    # Test 9: Certificates Manual Minting & Registry
    res = client.get("/admin/certificates", headers=admin_headers)
    assert res.status_code in [200, 201]
    print(f"[PASS] GET /admin/certificates passed ({len(res.json())} certificates found)")

    res = client.post("/admin/certificates/issue", headers=admin_headers, json={
        "user_id": student_user.id,
        "course_id": course_id,
        "score_pct": 98.5,
        "certificate_type": "course_completion"
    })
    assert res.status_code in [200, 201]
    mint_res = res.json()
    assert "token" in mint_res
    print(f"[PASS] POST /admin/certificates/issue passed (Minted token: {mint_res['token']})")

    # Test 10: Financials & Invoices
    res = client.get("/admin/financials", headers=admin_headers)
    assert res.status_code in [200, 201]
    fin = res.json()
    assert "gross_revenue" in fin and "total_invoices" in fin
    print(f"[PASS] GET /admin/financials passed (Gross: ${fin['gross_revenue']})")

    res = client.get("/admin/invoices", headers=admin_headers)
    assert res.status_code == 200
    print(f"[PASS] GET /admin/invoices passed ({len(res.json())} invoices found)")

    # Clean up test artifacts
    client.delete(f"/admin/batches/{batch_id}", headers=admin_headers)
    client.delete(f"/admin/exams/{exam_id}", headers=admin_headers)
    client.delete(f"/admin/courses/{course_id}", headers=admin_headers)
    print("[PASS] Cleanup completed successfully")

    print("\n=============================================")
    print("  ALL 10 ADMIN CONTROL CENTER TESTS PASSED!  ")
    print("=============================================")

if __name__ == "__main__":
    run_tests()
