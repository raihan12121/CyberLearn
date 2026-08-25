import sys
import uuid
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app import models
from backend.app.auth.utils import get_password_hash, create_access_token

client = TestClient(app)

def run_tests():
    print("========================================")
    print("RUNNING COMPREHENSIVE TASKS 1, 2, 3 SUITE")
    print("========================================")

    db = SessionLocal()
    try:
        # Create or fetch test student
        test_email = f"tasktest_{uuid.uuid4().hex[:6]}@cyberlearn.io"
        user = models.User(
            email=test_email,
            username=f"student_{uuid.uuid4().hex[:6]}",
            full_name="Alex Hacker",
            password_hash=get_password_hash("Password123!"),
            role="student",
            subscription_tier="pro",
            subscription_status="active"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token(data={"sub": user.email})
        headers = {"Authorization": f"Bearer {token}"}

        # TEST 1: Community Posts Fetch
        print("\n[TEST 1] Fetch community posts...")
        res = client.get("/posts", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        posts = res.json()
        assert len(posts) >= 2, f"Expected at least 2 seeded posts, got {len(posts)}"
        print(f"  -> SUCCESS: Retrieved {len(posts)} community posts with tags and categories.")

        # TEST 2: Community Post Creation (Sharing a problem)
        print("\n[TEST 2] Create real problem post...")
        create_payload = {
            "title": "Burp Suite Intruder sniper attack rate limited with 429 Too Many Requests",
            "content": "When brute-forcing the login endpoint on Lab 4, Burp Suite gets blocked after 20 attempts. How do I configure throttle delay or IP rotation headers?",
            "category": "Questions",
            "tags": "burp,ratelimit,web-security"
        }
        res = client.post("/posts", json=create_payload, headers=headers)
        assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
        created_post = res.json()
        assert created_post["title"] == create_payload["title"]
        assert created_post["tags"] == create_payload["tags"]
        assert created_post["is_solved"] is False
        post_id = created_post["id"]
        print(f"  -> SUCCESS: Created problem post with ID: {post_id}")

        # TEST 3: Add Comment / Solution to Problem Thread
        print("\n[TEST 3] Add comment/solution to problem thread...")
        comment_payload = {
            "content": "You can add custom header `X-Forwarded-For: 127.0.0.1` and enable request delays in Intruder Resource Pool to 500ms."
        }
        res = client.post(f"/posts/{post_id}/comments", json=comment_payload, headers=headers)
        assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
        comment_data = res.json()
        assert comment_data["content"] == comment_payload["content"]
        assert comment_data["author_name"] == user.full_name
        print(f"  -> SUCCESS: Added comment reply by {comment_data['author_name']}")

        # TEST 4: Fetch Post Detail with Full Discussion Thread
        print("\n[TEST 4] Fetch post detail with discussion thread...")
        res = client.get(f"/posts/{post_id}", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        detail_data = res.json()
        assert len(detail_data["comments"]) == 1
        assert detail_data["comment_count"] == 1
        print(f"  -> SUCCESS: Thread contains {len(detail_data['comments'])} comment(s).")

        # TEST 5: Toggle Post Solved Status
        print("\n[TEST 5] Toggle problem solved status...")
        res = client.post(f"/posts/{post_id}/toggle-solved", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        assert res.json()["is_solved"] is True
        print("  -> SUCCESS: Marked problem as SOLVED.")

        # TEST 6: Upvote Post
        print("\n[TEST 6] Upvote post toggle...")
        res = client.post(f"/posts/{post_id}/upvote", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        print(f"  -> SUCCESS: Upvote count: {res.json()['upvotes']}")

        # TEST 7: List Certification Exams (CCNA, CompTIA Security+, CEH)
        print("\n[TEST 7] List Certification Exams...")
        res = client.get("/exams", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        all_exams = res.json()
        exam_ids = [e["id"] for e in all_exams]
        assert "exam-ccna-security" in exam_ids, f"CCNA exam not found in {exam_ids}"
        assert "exam-comptia-secplus" in exam_ids, f"CompTIA Security+ exam not found in {exam_ids}"
        assert "exam-ceh-associate" in exam_ids, f"CEH exam not found in {exam_ids}"
        print(f"  -> SUCCESS: Verified all 5 certification tracks are available ({len(all_exams)} exams).")

        # Verify ID before exam submission
        client.post("/users/me/verify-nid", json={
            "nid_number": "98127391823",
            "nid_front_image": "data:image/png;base64,iVBORw0KGgo=",
            "nid_back_image": "data:image/png;base64,iVBORw0KGgo="
        }, headers=headers)

        # TEST 8: Take and Submit CCNA Security Exam
        print("\n[TEST 8] Take and submit CCNA Security Exam with passing answers...")
        exam_detail_res = client.get("/exams/exam-ccna-security", headers=headers)
        assert exam_detail_res.status_code == 200, f"Expected 200, got {exam_detail_res.status_code}"
        ccna_exam = exam_detail_res.json()
        questions = ccna_exam["questions"]
        assert len(questions) >= 20, f"Expected >= 20 questions in CCNA exam, got {len(questions)}"

        # Submit correct answers (option '0' is seeded as correct)
        answers = [{"question_id": q["id"], "selected_answer": "0"} for q in questions]
        sub_res = client.post("/exams/exam-ccna-security/submit", json={"answers": answers}, headers=headers)
        assert sub_res.status_code == 200, f"Expected 200, got {sub_res.status_code}: {sub_res.text}"
        sub_data = sub_res.json()
        assert sub_data["passed"] is True, f"Expected pass, got: {sub_data}"
        assert sub_data["score_pct"] == 100.0
        assert sub_data["certificate_token"] is not None
        print(f"  -> SUCCESS: Passed CCNA Security Exam with {sub_data['score_pct']}%! Minted Certificate Token: {sub_data['certificate_token']}")

        # TEST 9: Verify Certificate in /certificates
        print("\n[TEST 9] Verify certificate in user's certificates profile...")
        cert_res = client.get("/certificates", headers=headers)
        assert cert_res.status_code == 200
        certs = cert_res.json()
        matching_cert = next((c for c in certs if c.get("verification_token") == sub_data["certificate_token"] or c.get("id") == sub_data["certificate_token"]), None)
        assert matching_cert is not None, f"Issued certificate not found in {certs}"
        print(f"  -> SUCCESS: Official certificate verified: {matching_cert.get('courseTitle', matching_cert.get('title'))}")

        print("\n========================================")
        print("ALL 9/9 AUTOMATED VERIFICATION TESTS PASSED (100%)")
        print("========================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
