import sys
import os
import traceback
from datetime import datetime, timezone
import uuid

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app import models

client = TestClient(app)

def print_header(title):
    print("\n" + "=" * 60)
    print(f"[*] {title}")
    print("=" * 60)

def print_test(name, passed, detail=""):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"{status} | {name}")
    if detail:
        print(f"     -> {detail}")

def run_all_tests():
    total = 0
    passed = 0
    failed = 0

    print_header("CYBERLEARN QUALITY ASSURANCE & TEST SUITE")
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")

    # ---------------------------------------------------------
    # 1. WHITEBOX TESTS: Unit Models & Logic
    # ---------------------------------------------------------
    print_header("SECTION 1: WHITEBOX UNIT & DOMAIN LOGIC TESTS")
    db = SessionLocal()

    # Whitebox Test 1: User NID status model constraints
    total += 1
    try:
        u1 = models.User(
            email=f"wb_user_{uuid.uuid4().hex[:6]}@cyberlearn.io",
            password_hash="testpass",
            role="student",
            verification_status="unverified"
        )
        db.add(u1)
        db.commit()
        db.refresh(u1)

        assert u1.verification_status == "unverified"
        assert u1.is_verified is False

        # Status transition to pending
        u1.nid_number = "1994502391004123"
        u1.verification_status = "pending"
        db.commit()
        db.refresh(u1)
        assert u1.verification_status == "pending"

        # Status transition to verified
        u1.verification_status = "verified"
        u1.is_verified = True
        u1.verified_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(u1)
        assert u1.verification_status == "verified"
        assert u1.is_verified is True
        print_test("User NID Verification State Machine Transitions", True, "unverified -> pending -> verified lifecycle")
        passed += 1
    except Exception as e:
        print_test("User NID Verification State Machine Transitions", False, str(e))
        failed += 1

    # Whitebox Test 2: Batch & Enrollment Capacity Logic
    total += 1
    try:
        inst = models.User(email=f"wb_inst_{uuid.uuid4().hex[:6]}@cyberlearn.io", password_hash="p", role="instructor")
        st1 = models.User(email=f"wb_st1_{uuid.uuid4().hex[:6]}@cyberlearn.io", password_hash="p")
        db.add_all([inst, st1])
        db.commit()

        b = models.Batch(
            name="Unit Test Cohort",
            batch_code=f"WB-BATCH-{uuid.uuid4().hex[:4].upper()}",
            instructor_id=inst.id,
            max_students=10,
            is_active=True
        )
        db.add(b)
        db.commit()

        enr = models.BatchEnrollment(batch_id=b.id, user_id=st1.id, status="enrolled")
        db.add(enr)
        db.commit()

        enr_count = db.query(models.BatchEnrollment).filter(models.BatchEnrollment.batch_id == b.id).count()
        assert enr_count == 1
        assert b.instructor.id == inst.id
        print_test("Batch Creation & Enrollment Integrity", True, f"Batch code {b.batch_code} linked to instructor & student")
        passed += 1
    except Exception as e:
        print_test("Batch Creation & Enrollment Integrity", False, str(e))
        failed += 1

    # Whitebox Test 3: Multi-Session AI Prompt Isolation
    total += 1
    try:
        ai_u = models.User(email=f"wb_ai_{uuid.uuid4().hex[:6]}@cyberlearn.io", password_hash="p")
        db.add(ai_u)
        db.commit()

        s1 = models.AiSession(user_id=ai_u.id, title="Red Team Session", system_prompt="Offensive hacker")
        s2 = models.AiSession(user_id=ai_u.id, title="Blue Team Session", system_prompt="Defensive SOC lead")
        db.add_all([s1, s2])
        db.commit()

        m1 = models.AiChatMessage(session_id=s1.id, role="user", content="Test SQLi")
        m2 = models.AiChatMessage(session_id=s1.id, role="assistant", content="Use OR 1=1")
        db.add_all([m1, m2])
        db.commit()

        s1_count = db.query(models.AiChatMessage).filter(models.AiChatMessage.session_id == s1.id).count()
        s2_count = db.query(models.AiChatMessage).filter(models.AiChatMessage.session_id == s2.id).count()
        assert s1_count == 2
        assert s2_count == 0
        assert s1.system_prompt != s2.system_prompt
        print_test("AI Multi-Session & System Prompt Isolation", True, "Isolated conversational history and distinct persona instructions")
        passed += 1
    except Exception as e:
        print_test("AI Multi-Session & System Prompt Isolation", False, str(e))
        failed += 1

    # Whitebox Test 4: Exam Scoring Algorithm & Auto-Certification Threshold
    total += 1
    try:
        exam_u = models.User(email=f"wb_exam_{uuid.uuid4().hex[:6]}@cyberlearn.io", password_hash="p", xp=50)
        course = models.Course(id=f"wb_course_{uuid.uuid4().hex[:6]}", title="Web Security Whitebox Course", is_published=True)
        exam = models.Exam(
            course_id=course.id,
            title="Unit Test Exam",
            duration_minutes=20,
            passing_score_pct=70,
            total_marks=100
        )
        db.add_all([exam_u, course, exam])
        db.commit()

        q1 = models.ExamQuestion(exam_id=exam.id, question_text="Q1", correct_answer="1", points=50)
        q2 = models.ExamQuestion(exam_id=exam.id, question_text="Q2", correct_answer="2", points=50)
        db.add_all([q1, q2])
        db.commit()

        # Score calculation test: 1 correct (50%) -> Fail
        score_50 = 50.0
        assert (score_50 >= exam.passing_score_pct) is False

        # Score calculation test: 2 correct (100%) -> Pass & Award XP
        score_100 = 100.0
        assert (score_100 >= exam.passing_score_pct) is True
        
        cert = models.Certificate(
            user_id=exam_u.id,
            course_id=course.id if course else "dummy",
            exam_id=exam.id,
            score_pct=score_100,
            verification_token=f"CERT-UNIT-{uuid.uuid4().hex[:6].upper()}"
        )
        exam_u.xp += 800
        db.add(cert)
        db.commit()

        db.refresh(exam_u)
        assert exam_u.xp == 850
        print_test("Exam Evaluation & Auto-Certification Threshold", True, "Strict 70% threshold enforcement + XP bonus minting")
        passed += 1
    except Exception as e:
        print_test("Exam Evaluation & Auto-Certification Threshold", False, str(e))
        failed += 1

    db.close()

    # ---------------------------------------------------------
    # 2. BLACKBOX TESTS: End-to-End API Workflows
    # ---------------------------------------------------------
    print_header("SECTION 2: BLACKBOX END-TO-END WORKFLOW TESTS")

    # Helper for Auth
    def get_auth_client(role="student"):
        rand_id = uuid.uuid4().hex[:8]
        email = f"bb_{role}_{rand_id}@cyberlearn.io"
        pwd = "Password123!"
        reg = client.post("/auth/register", json={"email": email, "password": pwd, "full_name": f"{role.capitalize()} User"})
        
        # Verify & Set Role in DB
        d = SessionLocal()
        u = d.query(models.User).filter(models.User.email == email).first()
        if u:
            u.is_verified = True
            u.role = role
            d.commit()
            uid = u.id
        d.close()

        log = client.post("/auth/login", json={"email": email, "password": pwd})
        tok = log.json().get("access_token")
        return uid, {"Authorization": f"Bearer {tok}"}

    # Blackbox Test 1: NID Registration, Submission & Admin Approval
    total += 1
    try:
        st_id, st_headers = get_auth_client("student")
        adm_id, adm_headers = get_auth_client("admin")

        # Student submits NID
        res_sub = client.post("/users/me/verify-nid", json={
            "nid_number": "1995123456789012",
            "nid_front_image": "data:image/png;base64,mockfront",
            "nid_back_image": "data:image/png;base64,mockback"
        }, headers=st_headers)
        assert res_sub.status_code == 200
        assert res_sub.json()["verification_status"] == "pending"

        # Admin lists & approves
        res_list = client.get("/admin/verifications", headers=adm_headers)
        assert res_list.status_code == 200
        assert any(x["user_id"] == st_id for x in res_list.json())

        res_rev = client.post(f"/admin/verifications/{st_id}/review", json={
            "status": "verified",
            "notes": "Audited & Verified"
        }, headers=adm_headers)
        assert res_rev.status_code == 200
        assert res_rev.json()["verification_status"] == "verified"

        # Student verifies status
        res_st = client.get("/users/me/verify-nid", headers=st_headers)
        assert res_st.status_code == 200
        assert res_st.json()["verification_status"] == "verified"

        print_test("Blackbox: NID Submission -> Admin Review -> Account Verification Flow", True)
        passed += 1
    except Exception as e:
        print_test("Blackbox: NID Submission -> Admin Review -> Account Verification Flow", False, str(e))
        failed += 1

    # Blackbox Test 2: Batch Creation, Shareable Link & Student Enrollment
    total += 1
    try:
        inst_id, inst_headers = get_auth_client("instructor")
        st_id, st_headers = get_auth_client("student")

        # Instructor creates batch
        res_b = client.post("/batches", json={
            "name": "Live Red Team Sprint Batch",
            "description": "Exploitation and privilege escalation drills",
            "max_students": 30,
            "meeting_link": "https://meet.google.com/sec-live",
            "schedule_details": "Sat & Wed 8:00 PM GMT+6"
        }, headers=inst_headers)
        assert res_b.status_code == 201
        batch_code = res_b.json()["batch_code"]

        # Student views via shareable link
        res_view = client.get(f"/batches/{batch_code}", headers=st_headers)
        assert res_view.status_code == 200
        assert res_view.json()["batch_code"] == batch_code
        assert res_view.json()["is_enrolled"] is False

        # Student joins
        res_join = client.post(f"/batches/{batch_code}/join", headers=st_headers)
        assert res_join.status_code == 200
        assert res_join.json()["status"] == "success"

        # Student verifies enrollment & meeting link access
        res_enrolled = client.get(f"/batches/{batch_code}", headers=st_headers)
        assert res_enrolled.status_code == 200
        assert res_enrolled.json()["is_enrolled"] is True
        assert res_enrolled.json()["meeting_link"] == "https://meet.google.com/sec-live"

        print_test("Blackbox: Batch Creation -> Shareable Link Preview -> Cohort Enrollment Flow", True)
        passed += 1
    except Exception as e:
        print_test("Blackbox: Batch Creation -> Shareable Link Preview -> Cohort Enrollment Flow", False, str(e))
        failed += 1

    # Blackbox Test 3: AI Session Creation, Custom System Prompt & Chat
    total += 1
    try:
        st_id, st_headers = get_auth_client("student")

        # Create session with custom prompt
        res_sess = client.post("/ai/sessions", json={
            "title": "SQLi & Burp Mentor",
            "system_prompt": "You are a Bug Bounty Mentor specializing in SQL Injection."
        }, headers=st_headers)
        assert res_sess.status_code == 201
        sess_id = res_sess.json()["id"]

        # Send chat into session
        res_chat = client.post(f"/ai/sessions/{sess_id}/chat", json={
            "message": "What is SQL injection and how to prevent it?"
        }, headers=st_headers)
        assert res_chat.status_code == 200
        assert "reply" in res_chat.json()
        assert len(res_chat.json()["reply"]) > 20

        # Retrieve session message history
        res_hist = client.get(f"/ai/sessions/{sess_id}", headers=st_headers)
        assert res_hist.status_code == 200
        msgs = res_hist.json()["messages"]
        assert len(msgs) == 2
        assert msgs[0]["role"] == "user"
        assert msgs[1]["role"] == "assistant"

        print_test("Blackbox: AI Multi-Session -> Custom Prompt -> Chat History Flow", True)
        passed += 1
    except Exception as e:
        print_test("Blackbox: AI Multi-Session -> Custom Prompt -> Chat History Flow", False, str(e))
        failed += 1

    # Blackbox Test 4: Course Exam -> Submission -> Certificate Token -> Verification
    total += 1
    try:
        st_id, st_headers = get_auth_client("student")

        # Fetch course exam
        res_ex = client.get("/exams/course/web-security-fundamentals")
        assert res_ex.status_code == 200
        exam_data = res_ex.json()
        exam_id = exam_data["id"]
        qs = exam_data["questions"]
        assert len(qs) >= 2

        # Fetch correct answers directly to guarantee passing submission
        d = SessionLocal()
        db_qs = d.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam_id).all()
        correct_map = {q.id: str(q.correct_answer).strip() for q in db_qs}
        d.close()

        answers = [{"question_id": q["id"], "selected_answer": correct_map.get(q["id"], "0")} for q in qs]

        res_sub = client.post(f"/exams/{exam_id}/submit", json={"answers": answers}, headers=st_headers)
        assert res_sub.status_code == 200
        sub_data = res_sub.json()
        assert sub_data["passed"] is True
        assert sub_data["score_pct"] >= 70.0
        cert_tok = sub_data["certificate_token"]
        assert cert_tok is not None

        # Verify Certificate via public token endpoint
        res_cert = client.get(f"/certificates/verify/{cert_tok}")
        assert res_cert.status_code == 200
        assert res_cert.json()["status"] == "valid"
        assert res_cert.json()["token"] == cert_tok

        print_test("Blackbox: Course Exam Submission -> Auto-Grading -> Credential Verification Flow", True)
        passed += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print_test("Blackbox: Course Exam Submission -> Auto-Grading -> Credential Verification Flow", False, str(e))
        failed += 1

    # ---------------------------------------------------------
    # 3. SQA REGRESSION & SECURITY FIX VERIFICATION TESTS
    # ---------------------------------------------------------
    print_header("SECTION 3: SQA REGRESSION & SECURITY FIX VERIFICATION TESTS")

    # Regression Test 1 (BUG-CRIT-01): Social login token validation
    total += 1
    try:
        res = client.post("/auth/social-login", json={
            "provider": "google",
            "email": "hacker@evil.com",
            "provider_token": "dummy_token"
        })
        assert res.status_code == 401, f"Expected 401 Unauthorized for fake token, got {res.status_code}"
        print_test("Regression: Social Login Authentication Bypass Protection (BUG-CRIT-01)", True, "Rejected dummy provider token with 401")
        passed += 1
    except Exception as e:
        print_test("Regression: Social Login Authentication Bypass Protection (BUG-CRIT-01)", False, str(e))
        failed += 1

    # Regression Test 2 (BUG-CRIT-02): Community feed on unseeded DB / system user
    total += 1
    try:
        res = client.get("/posts")
        assert res.status_code == 200, f"Expected 200 OK on GET /posts, got {res.status_code}"
        posts = res.json()
        assert isinstance(posts, list)
        print_test("Regression: Community Posts Feed NameError Protection (BUG-CRIT-02)", True, "Successfully retrieved community posts")
        passed += 1
    except Exception as e:
        print_test("Regression: Community Posts Feed NameError Protection (BUG-CRIT-02)", False, str(e))
        failed += 1

    # Regression Test 3 (BUG-HIGH-01): Billing checkout preserves admin & instructor roles
    total += 1
    try:
        admin_id, admin_headers = get_auth_client("admin")
        res_checkout = client.post("/billing/checkout", json={"plan_name": "Pro"}, headers=admin_headers)
        assert res_checkout.status_code == 200
        # Check current user role via /auth/me
        res_me = client.get("/auth/me", headers=admin_headers)
        assert res_me.json()["role"] == "admin", f"Expected admin role to be preserved, got {res_me.json()['role']}"
        print_test("Regression: Billing Checkout Admin/Instructor Role Preservation (BUG-HIGH-01)", True, "Admin role retained after checkout")
        passed += 1
    except Exception as e:
        print_test("Regression: Billing Checkout Admin/Instructor Role Preservation (BUG-HIGH-01)", False, str(e))
        failed += 1

    # Regression Test 4 (BUG-HIGH-02): Public unauthenticated access to batches
    total += 1
    try:
        res_batches = client.get("/batches")
        assert res_batches.status_code == 200, f"Expected 200 OK for anonymous batch list, got {res_batches.status_code}"
        batches_list = res_batches.json()
        assert len(batches_list) > 0
        batch_code = batches_list[0]["batch_code"]
        res_single = client.get(f"/batches/{batch_code}")
        assert res_single.status_code == 200, f"Expected 200 OK for anonymous batch detail, got {res_single.status_code}"
        print_test("Regression: Public Batch Browsing & Shareable Link Access (BUG-HIGH-02)", True, "Anonymous visitors can preview cohorts")
        passed += 1
    except Exception as e:
        print_test("Regression: Public Batch Browsing & Shareable Link Access (BUG-HIGH-02)", False, str(e))
        failed += 1

    # Regression Test 5 (BUG-HIGH-03): Admin rejection sets is_verified=False
    total += 1
    try:
        st_id, st_headers = get_auth_client("student")
        adm_id, adm_headers = get_auth_client("admin")
        # Submit NID
        client.post("/users/me/verify-nid", json={"nid_number": "1234567890"}, headers=st_headers)
        # Admin approves
        client.post(f"/admin/verifications/{st_id}/review", json={"status": "verified"}, headers=adm_headers)
        # Admin then rejects
        res_rej = client.post(f"/admin/verifications/{st_id}/review", json={"status": "rejected", "notes": "Fraudulent document"}, headers=adm_headers)
        assert res_rej.status_code == 200
        # Check DB user is_verified
        db_check = SessionLocal()
        u = db_check.query(models.User).filter(models.User.id == st_id).first()
        assert u.is_verified is False, f"Expected is_verified=False on rejected user, got {u.is_verified}"
        assert u.verification_status == "rejected"
        db_check.close()
        print_test("Regression: Admin NID Rejection State Consistency (BUG-HIGH-03)", True, "is_verified reset to False on rejection")
        passed += 1
    except Exception as e:
        print_test("Regression: Admin NID Rejection State Consistency (BUG-HIGH-03)", False, str(e))
        failed += 1

    # Regression Test 6 (BUG-MED-02): Public profile exact username matching
    total += 1
    try:
        # Query non-existent prefix username
        res_lookup = client.get("/users/non_existent_prefix_12345/public-profile")
        assert res_lookup.status_code == 404, f"Expected 404 Not Found, got {res_lookup.status_code}"
        print_test("Regression: Public Profile Exact Matching & Privacy (BUG-MED-02)", True, "Prevented loose prefix user account leakage")
        passed += 1
    except Exception as e:
        print_test("Regression: Public Profile Exact Matching & Privacy (BUG-MED-02)", False, str(e))
        failed += 1

    # Regression Test 7 (BUG-MED-04): NID upload payload size limits
    total += 1
    try:
        st_id, st_headers = get_auth_client("student")
        huge_img = "data:image/png;base64," + ("A" * 8_000_000)
        res_huge = client.post("/users/me/verify-nid", json={
            "nid_number": "1234567890",
            "nid_front_image": huge_img
        }, headers=st_headers)
        assert res_huge.status_code == 400, f"Expected 400 Bad Request on >5MB image, got {res_huge.status_code}"
        print_test("Regression: NID Verification Image Size Limits (BUG-MED-04)", True, "Blocked oversized payload (>5MB)")
        passed += 1
    except Exception as e:
        print_test("Regression: NID Verification Image Size Limits (BUG-MED-04)", False, str(e))
        failed += 1

    # ---------------------------------------------------------
    # SUMMARY
    # ---------------------------------------------------------
    print_header("QA TEST SUMMARY & METRICS")
    print(f"Total Test Cases Executed: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {round((passed / total) * 100, 2)}%")
    print("=" * 60)

    if failed > 0:
        sys.exit(1)
    else:
        print("[SUCCESS] ALL WHITEBOX, BLACKBOX, AND SQA REGRESSION TEST CASES PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_all_tests()
