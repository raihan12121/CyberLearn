import random
import sys
from fastapi.testclient import TestClient
from app.main import app

def test_endpoints():
    print("--- STARTING ENDPOINT DEEP AUDIT ---")
    client = TestClient(app)
    
    # 1. Health check
    print("[1] Testing API Health Check...")
    r = client.get("/")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    print("Health check OK:", r.json())
    
    # Generate random test user
    rand_id = random.randint(1000, 9999)
    email = f"audit_user_{rand_id}@cyberlearn.io"
    password = f"P@ssword_{rand_id}"
    full_name = f"Audit User {rand_id}"
    
    # 2. Register user
    print("\n[2] Testing User Registration...")
    reg_data = {
        "email": email,
        "password": password,
        "full_name": full_name
    }
    r = client.post("/auth/register", json=reg_data)
    assert r.status_code == 201, f"Registration failed: {r.status_code} - {r.text}"
    user_data = r.json()
    print("Registration OK. User ID:", user_data.get("id"))
    
    # 3. Login
    print("\n[3] Testing User Login...")
    login_data = {
        "email": email,
        "password": password
    }
    r = client.post("/auth/login", json=login_data)
    assert r.status_code == 200, f"Login failed: {r.status_code} - {r.text}"
    token_data = r.json()
    access_token = token_data.get("access_token")
    assert access_token, "Access token not returned"
    print("Login OK. Access Token acquired.")
    
    auth_headers = {"Authorization": f"Bearer {access_token}"}
    
    # Test unauthorized access to admin metrics (user is currently a student)
    print("Testing unauthorized GET /admin/metrics (expects 403)...")
    unauth_r = client.get("/admin/metrics", headers=auth_headers)
    assert unauth_r.status_code == 403, f"Expected 403 Forbidden for student, got {unauth_r.status_code}"
    print("Unauthorized access check OK (received 403).")

    # Promote user to admin and active subscriber using app database session
    from app.database import SessionLocal
    from app import models
    db = SessionLocal()
    db_u = db.query(models.User).filter(models.User.email == email).first()
    if db_u:
        db_u.role = 'admin'
        db_u.subscription_status = 'active'
        db_u.subscription_tier = 'pro'
        db.commit()
    db.close()
    print("Promoted test user to admin in DB session.")

    # 4. Get current user (me)
    print("\n[4] Testing GET /auth/me...")
    r = client.get("/auth/me", headers=auth_headers)
    assert r.status_code == 200, f"GET me failed: {r.status_code} - {r.text}"
    profile = r.json()
    assert profile.get("email") == email, "Profile email mismatch"
    print("Me API OK. Current XP:", profile.get("xp"))
    
    # 5. Get courses catalog
    print("\n[5] Testing GET /courses...")
    r = client.get("/courses")
    assert r.status_code == 200, f"GET courses failed: {r.status_code} - {r.text}"
    courses = r.json()
    assert len(courses) > 0, "No courses found (seeding error?)"
    print(f"Courses catalog OK. Found {len(courses)} courses.")
    for idx, c in enumerate(courses):
        print(f"  - Course {idx + 1}: {c.get('title')} ({c.get('difficulty')})")
        
    course_id = courses[0].get("id")
    
    # 6. Get course details
    print(f"\n[6] Testing GET /courses/{course_id}...")
    r = client.get(f"/courses/{course_id}")
    assert r.status_code == 200, f"GET course detail failed: {r.status_code} - {r.text}"
    course_detail = r.json()
    print(f"Course detail OK: {course_detail.get('title')}")
    lessons = course_detail.get("lessons", [])
    assert len(lessons) > 0, "No lessons seeded in course"
    print(f"  Found {len(lessons)} lessons inside the course.")
    
    lesson_id = lessons[0].get("id")
    
    # 7. Update course lesson progress
    print(f"\n[7] Testing POST /courses/progress (Completing lesson {lesson_id})...")
    progress_data = {
        "course_id": course_id,
        "lesson_id": lesson_id,
        "status": "completed",
        "completion_pct": 100.0
    }
    r = client.post("/courses/progress", json=progress_data, headers=auth_headers)
    assert r.status_code == 200, f"Progress update failed: {r.status_code} - {r.text}"
    prog_res = r.json()
    assert prog_res.get("status") == "completed", "Progress status mismatch"
    print("Progress update OK. Status logged successfully.")
    
    # Verify user XP increased by 50
    r = client.get("/auth/me", headers=auth_headers)
    profile = r.json()
    print("Current User XP (should be 50):", profile.get("xp"))
    assert profile.get("xp") == 50, f"XP not awarded correctly. Expected 50, got {profile.get('xp')}"
    
    # 8. Get user progress list
    print("\n[8] Testing GET /courses/progress...")
    r = client.get("/courses/progress", headers=auth_headers)
    assert r.status_code == 200, f"GET progress failed: {r.status_code} - {r.text}"
    progress_list = r.json()
    assert len(progress_list) == 1, "Expected exactly 1 progress entry"
    assert progress_list[0].get("lesson_id") == lesson_id, "Progress entry lesson mismatch"
    print("GET progress list OK.")
    
    # 9. Get practice labs catalog
    print("\n[9] Testing GET /labs...")
    r = client.get("/labs")
    assert r.status_code == 200, f"GET labs failed: {r.status_code} - {r.text}"
    labs = r.json()
    assert len(labs) > 0, "No labs found"
    print(f"Labs catalog OK. Found {len(labs)} labs.")
    for idx, l in enumerate(labs):
        print(f"  - Lab {idx + 1}: {l.get('title')} ({l.get('type')})")
        
    lab_id = "linux-navigation"
    
    # 10. Start practice lab session
    print(f"\n[10] Testing POST /labs/start (Lab {lab_id})...")
    r = client.post("/labs/start", json={"lab_id": lab_id}, headers=auth_headers)
    assert r.status_code == 200, f"Start lab failed: {r.status_code} - {r.text}"
    session_data = r.json()
    session_id = session_data.get("id")
    assert session_id, "No session ID returned"
    assert session_data.get("status") == "running", "Session status is not running"
    print(f"Start lab OK. Session ID: {session_id}")
    
    # 11. Submit incorrect flag
    print("\n[11] Testing POST /labs/{session_id}/submit with incorrect flag...")
    r = client.post(f"/labs/{session_id}/submit?flag_submission=FLAG{{wrong}}", headers=auth_headers)
    assert r.status_code == 200, f"Flag submission API failed: {r.status_code} - {r.text}"
    submit_res = r.json()
    assert not submit_res.get("correct"), "Incorrect flag marked correct"
    print("Incorrect flag submission logic OK. Message:", submit_res.get("message"))
    
    # 12. Submit correct flag (fetch it dynamically via admin endpoint)
    print("\n[12] Testing POST /labs/{session_id}/submit with correct flag...")
    # First retrieve the correct flag via admin endpoint (user was promoted to admin above)
    r = client.get(f"/labs/{lab_id}/flag", headers=auth_headers)
    assert r.status_code == 200, f"GET lab flag failed: {r.status_code} - {r.text}"
    correct_flag = r.json().get("flag")
    assert correct_flag and correct_flag.startswith("FLAG{"), f"Invalid flag format: {correct_flag}"
    r = client.post(f"/labs/{session_id}/submit?flag_submission={correct_flag}", headers=auth_headers)
    assert r.status_code == 200, f"Flag submission API failed: {r.status_code} - {r.text}"
    submit_res = r.json()
    assert submit_res.get("correct"), "Correct flag marked incorrect"
    print("Correct flag submission OK. Message:", submit_res.get("message"))
    
    # Verify user XP increased by lab reward (100) -> total 150
    r = client.get("/auth/me", headers=auth_headers)
    profile = r.json()
    print("Current User XP (should be 150):", profile.get("xp"))
    assert profile.get("xp") == 150, f"XP reward mismatch. Expected 150, got {profile.get('xp')}"
    
    # 13. AI Cyber Coach Chat
    print("\n[13] Testing POST /ai/chat...")
    chat_req = {
        "message": "Explain Same-Origin Policy (SOP)",
        "history": []
    }
    r = client.post("/ai/chat", json=chat_req, headers=auth_headers)
    assert r.status_code == 200, f"AI chat failed: {r.status_code} - {r.text}"
    chat_res = r.json()
    assert "reply" in chat_res, "AI reply missing"
    print("AI Chat Coach OK. Coach Reply:", chat_res.get("reply"))
    
    # 14. Get community feed posts
    print("\n[14] Testing GET /posts...")
    r = client.get("/posts")
    assert r.status_code == 200, f"GET posts failed: {r.status_code} - {r.text}"
    posts = r.json()
    assert len(posts) > 0, "No community posts found"
    print(f"Community feed OK. Found {len(posts)} posts.")
    
    # 15. Create a community post
    print("\n[15] Testing POST /posts...")
    post_req = {
        "title": "Deep Audit Test Post",
        "content": "This is a post created automatically during the endpoint audit.",
        "category": "General"
    }
    r = client.post("/posts", json=post_req, headers=auth_headers)
    assert r.status_code == 201, f"POST post failed: {r.status_code} - {r.text}"
    created_post = r.json()
    assert created_post.get("title") == "Deep Audit Test Post", "Post title mismatch"
    print("Create post OK. Post ID:", created_post.get("id"))
    
    # 16. Admin metrics
    print("\n[16] Testing GET /admin/metrics...")
    r = client.get("/admin/metrics", headers=auth_headers)
    assert r.status_code == 200, f"GET admin metrics failed: {r.status_code} - {r.text}"
    metrics = r.json()
    assert "stats" in metrics, "metrics stats missing"
    assert "containers" in metrics, "metrics containers missing"
    assert "resources" in metrics, "metrics resources missing"
    print("Admin Metrics API OK. Total Users reported:", metrics["stats"][0].get("value"))
    print("System active resources:", metrics["resources"])
    
    # 17. Update Profile (PUT /users/me)
    print("\n[17] Testing PUT /users/me...")
    update_data = {
        "full_name": f"Updated Name {rand_id}",
        "username": f"audit_username_{rand_id}",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg"
    }
    r = client.put("/users/me", json=update_data, headers=auth_headers)
    assert r.status_code == 200, f"Profile update failed: {r.status_code} - {r.text}"
    updated_profile = r.json()
    assert updated_profile.get("full_name") == f"Updated Name {rand_id}", "Updated name mismatch"
    assert updated_profile.get("username") == f"audit_username_{rand_id}", "Updated username mismatch"
    print("Profile update OK.")
    
    # 18. Change Password (PUT /users/me/password)
    print("\n[18] Testing PUT /users/me/password & Re-login...")
    new_test_password = f"New_P@ss_{rand_id}"
    pw_data = {
        "current_password": password,
        "new_password": new_test_password
    }
    r = client.put("/users/me/password", json=pw_data, headers=auth_headers)
    assert r.status_code == 200, f"Change password failed: {r.status_code} - {r.text}"
    
    # Verify login with new password works
    re_login_data = {
        "email": email,
        "password": new_test_password
    }
    r = client.post("/auth/login", json=re_login_data)
    assert r.status_code == 200, f"Re-login with new password failed: {r.status_code} - {r.text}"
    new_token_data = r.json()
    new_access_token = new_token_data.get("access_token")
    auth_headers = {"Authorization": f"Bearer {new_access_token}"}
    print("Change password and re-login verification OK.")
    
    # 19. Get Profile Details (GET /users/me/profile)
    print("\n[19] Testing GET /users/me/profile...")
    r = client.get("/users/me/profile", headers=auth_headers)
    assert r.status_code == 200, f"GET profile details failed: {r.status_code} - {r.text}"
    profile_details = r.json()
    assert "rank" in profile_details, "profile rank missing"
    assert "skill_stats" in profile_details, "profile skill_stats missing"
    assert "badges" in profile_details, "profile badges missing"
    assert "timeline" in profile_details, "profile timeline missing"
    print("Profile Details OK. User Rank:", profile_details.get("rank"), "| Solved Labs:", profile_details.get("solved_labs_count"))
    
    # 20. Get Leaderboard (GET /leaderboard)
    print("\n[20] Testing GET /leaderboard...")
    r = client.get("/leaderboard", headers=auth_headers)
    assert r.status_code == 200, f"GET leaderboard failed: {r.status_code} - {r.text}"
    leaderboard = r.json()
    assert len(leaderboard) > 0, "Leaderboard list is empty"
    # Find current user in leaderboard
    user_entry = next((item for item in leaderboard if item.get("current")), None)
    assert user_entry is not None, "Current user not highlighted in leaderboard"
    print(f"Leaderboard OK. Leader: {leaderboard[0].get('name')} | User Rank: {user_entry.get('rank')}")
    
    # 21. Get Certificates (GET /certificates)
    print("\n[21] Testing GET /certificates...", headers := auth_headers)
    r = client.get("/certificates", headers=headers)
    assert r.status_code == 200, f"GET certificates failed: {r.status_code} - {r.text}"
    certs = r.json()
    assert len(certs) > 0, "Certificates list empty"
    print(f"Certificates OK. Found {len(certs)} courses. Statuses: {[c.get('status') for c in certs]}")
    
    print("\n--- ALL BACKEND ENDPOINTS VERIFIED & WORKING CORRECTLY ---")

if __name__ == "__main__":
    try:
        test_endpoints()
    except AssertionError as e:
        print("\n[!] AUDIT FAILURE:", e)
        sys.exit(1)
    except Exception as e:
        print("\n[!] UNEXPECTED ERROR:", e)
        sys.exit(1)
    sys.exit(0)
