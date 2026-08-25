import random
from fastapi.testclient import TestClient
from app.main import app

def test_subscription_access_control():
    client = TestClient(app)
    rand_id = random.randint(10000, 99999)
    email = f"student_sub_{rand_id}@cyberlearn.io"
    password = f"P@ssword_{rand_id}"
    full_name = f"Student User {rand_id}"

    # 1. Register a regular Free student
    print("[1] Registering Free student account...")
    reg_r = client.post("/auth/register", json={
        "email": email,
        "password": password,
        "full_name": full_name
    })
    assert reg_r.status_code == 201, f"Registration failed: {reg_r.text}"
    
    # 2. Login
    login_r = client.post("/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_r.status_code == 200, f"Login failed: {login_r.text}"
    token = login_r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Check /auth/me returns is_subscribed=False for Free student
    print("[2] Checking /auth/me for Free student...")
    me_r = client.get("/auth/me", headers=headers)
    assert me_r.status_code == 200
    me_data = me_r.json()
    assert me_data.get("is_subscribed") is False, "Free student should not be marked as subscribed"
    assert me_data.get("role") == "student"

    # 4. Check billing status endpoint
    status_r = client.get("/billing/status", headers=headers)
    assert status_r.status_code == 200
    b_status = status_r.json()
    assert b_status.get("is_subscribed") is False
    assert b_status.get("can_access_courses") is False
    assert b_status.get("can_access_labs") is False

    # 5. Course Catalog is browseable, but Course Detail redacts lesson content
    print("[3] Testing Course detail redaction for Free student...")
    courses_r = client.get("/courses")
    assert courses_r.status_code == 200
    courses_list = courses_r.json()
    assert len(courses_list) > 0
    course_id = courses_list[0]["id"]

    course_detail_r = client.get(f"/courses/{course_id}", headers=headers)
    assert course_detail_r.status_code == 200
    course_data = course_detail_r.json()
    assert len(course_data["lessons"]) > 0
    # Every lesson must be locked and content redacted
    for lesson in course_data["lessons"]:
        assert lesson.get("is_locked") is True, "Lesson should be marked is_locked=True for Free student"
        assert lesson.get("video_url") is None, "Lesson video_url must be redacted for Free student"
        assert "Subscription Required" in (lesson.get("content") or ""), "Lesson content should be redacted"

    # 6. Free student CANNOT update course progress (403 Forbidden)
    print("[4] Testing POST /courses/progress blocked for Free student...")
    lesson_id = course_data["lessons"][0]["id"]
    progress_r = client.post("/courses/progress", json={
        "course_id": course_id,
        "lesson_id": lesson_id,
        "status": "completed",
        "completion_pct": 100.0
    }, headers=headers)
    assert progress_r.status_code == 403, f"Expected 403 Forbidden for unpaid progress update, got {progress_r.status_code}"
    assert "Subscription required" in progress_r.json().get("detail", "")

    # 7. Free student CANNOT submit quizzes (403 Forbidden)
    print("[5] Testing POST /courses/lessons/.../quiz/submit blocked for Free student...")
    quiz_r = client.post(f"/courses/lessons/{lesson_id}/quiz/submit", json={
        "answers": [{"question_id": "q1", "selected_option": 0}]
    }, headers=headers)
    assert quiz_r.status_code == 403, f"Expected 403 Forbidden for unpaid quiz submit, got {quiz_r.status_code}"

    # 8. Free student CANNOT start practice lab (403 Forbidden)
    print("[6] Testing POST /labs/start blocked for Free student...")
    labs_r = client.get("/labs")
    assert labs_r.status_code == 200
    labs_list = labs_r.json()
    assert len(labs_list) > 0
    lab_id = labs_list[0]["id"]

    start_lab_r = client.post("/labs/start", json={"lab_id": lab_id}, headers=headers)
    assert start_lab_r.status_code == 403, f"Expected 403 Forbidden for unpaid lab start, got {start_lab_r.status_code}"
    assert "Subscription required" in start_lab_r.json().get("detail", "")

    # 9. Free student upgrades / pays subscription fee (Pro Plan)
    print("[7] Upgrading user to Pro subscription via /billing/checkout...")
    checkout_r = client.post("/billing/checkout", json={
        "plan_name": "Pro",
        "billing_period": "monthly"
    }, headers=headers)
    assert checkout_r.status_code == 200
    checkout_data = checkout_r.json()
    assert checkout_data.get("is_subscribed") is True
    assert checkout_data.get("user_role") == "pro_member"
    assert checkout_data.get("subscription_tier") == "pro"

    # 10. Check /auth/me now reflects Pro membership & is_subscribed=True
    print("[8] Verifying /auth/me reflects active subscription...")
    me_r2 = client.get("/auth/me", headers=headers)
    assert me_r2.status_code == 200
    me_data2 = me_r2.json()
    assert me_data2.get("is_subscribed") is True
    assert me_data2.get("role") == "pro_member"
    assert me_data2.get("subscription_tier") == "pro"

    # 11. Now Pro user CAN view full unlocked course detail
    print("[9] Testing unlocked course lessons for Pro subscriber...")
    course_detail_r2 = client.get(f"/courses/{course_id}", headers=headers)
    assert course_detail_r2.status_code == 200
    course_data2 = course_detail_r2.json()
    first_lesson = course_data2["lessons"][0]
    assert first_lesson.get("is_locked") is False, "Lesson should be unlocked for Pro subscriber"
    assert "Subscription Required" not in (first_lesson.get("content") or ""), "Lesson content should be unredacted"

    # 12. Pro user CAN update course progress
    print("[10] Testing POST /courses/progress allowed for Pro subscriber...")
    progress_r2 = client.post("/courses/progress", json={
        "course_id": course_id,
        "lesson_id": lesson_id,
        "status": "completed",
        "completion_pct": 100.0
    }, headers=headers)
    assert progress_r2.status_code == 200, f"Progress update failed: {progress_r2.text}"
    assert progress_r2.json().get("status") == "completed"

    # 13. Pro user CAN start lab sandbox sessions
    print("[11] Testing POST /labs/start allowed for Pro subscriber...")
    start_lab_r2 = client.post("/labs/start", json={"lab_id": lab_id}, headers=headers)
    assert start_lab_r2.status_code == 200, f"Lab start failed: {start_lab_r2.text}"
    session_id = start_lab_r2.json()["id"]
    assert session_id is not None

    # 14. Pro user CAN reset lab sessions and submit flags
    print("[12] Testing lab reset and flag submission for Pro subscriber...")
    reset_r = client.post(f"/labs/{session_id}/reset", headers=headers)
    assert reset_r.status_code == 200

    # 15. User cancels subscription -> Access is locked again
    print("[13] Testing subscription cancellation...")
    cancel_r = client.post("/billing/cancel", headers=headers)
    assert cancel_r.status_code == 200
    assert cancel_r.json().get("subscription_status") == "canceled"

    # Verify locked again
    start_lab_locked = client.post("/labs/start", json={"lab_id": lab_id}, headers=headers)
    assert start_lab_locked.status_code == 403, "Lab should be locked again after cancellation"

    print("[SUCCESS] All subscription access control tests PASSED successfully!")

if __name__ == "__main__":
    test_subscription_access_control()
