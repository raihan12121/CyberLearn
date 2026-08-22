import pytest
import secrets
import json
import base64
from fastapi.testclient import TestClient
from app.main import app, _rate_limit_records
from app.database import SessionLocal
from app import models

client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_rate_limits():
    _rate_limit_records.clear()
    yield
    _rate_limit_records.clear()

def create_test_user(role: str = "student", xp: int = 500) -> tuple:
    """Helper to create and authenticate a test user."""
    rand = secrets.token_hex(4)
    email = f"qa_{role}_{rand}@cyberlearn.io"
    password = f"P@ssword_{rand}"
    
    reg_res = client.post("/auth/register", json={
        "email": email,
        "password": password,
        "full_name": f"QA Test {role.capitalize()}",
        "username": f"qa_{role}_{rand}"
    })
    assert reg_res.status_code == 201

    # Verify and set role/xp in DB
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.email == email).first()
    user.is_verified = True
    user.role = role
    user.xp = xp
    db.commit()
    user_id = user.id
    db.close()

    login_res = client.post("/auth/login", json={"email": email, "password": password})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return user_id, email, headers


# ---------------------------------------------------------------------------
# Test 1: Social Login Security & Forgery Rejection
# ---------------------------------------------------------------------------
def test_social_login_rejects_fake_and_mismatched_tokens():
    # 1. Reject dummy / placeholder token
    res = client.post("/auth/social-login", json={
        "provider": "google",
        "email": "victim_admin@cyberlearn.io",
        "provider_token": "dummy_token"
    })
    assert res.status_code == 401

    # 2. Reject short / invalid string token
    res2 = client.post("/auth/social-login", json={
        "provider": "google",
        "email": "victim_admin@cyberlearn.io",
        "provider_token": "invalid_short_token"
    })
    assert res2.status_code == 401

    # 3. Reject forged JWT where payload email doesn't match requested login email
    header_b64 = base64.urlsafe_b64encode(json.dumps({"alg": "RS256", "typ": "JWT"}).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps({"sub": "attacker_123", "email": "attacker@evil.com"}).encode()).decode().rstrip("=")
    fake_jwt = f"{header_b64}.{payload_b64}.fake_sig_12345678901234567890"
    
    res3 = client.post("/auth/social-login", json={
        "provider": "google",
        "email": "target_user@cyberlearn.io",
        "provider_token": fake_jwt
    })
    assert res3.status_code == 401


# ---------------------------------------------------------------------------
# Test 2: Account Deletion Cascading Without Foreign Key Violations
# ---------------------------------------------------------------------------
def test_user_account_deletion_with_all_cascading_relations():
    user_id, email, headers = create_test_user(role="student", xp=1000)

    # 1. Create a lab session
    lab_res = client.post("/labs/start", json={"lab_id": "linux-navigation"}, headers=headers)
    assert lab_res.status_code == 200

    # 2. Create progress entry
    prog_res = client.post("/courses/progress", json={
        "course_id": "web-security-fundamentals",
        "lesson_id": "web-intro",
        "status": "completed",
        "completion_pct": 100.0
    }, headers=headers)
    assert prog_res.status_code == 200

    # 3. Create a community post & upvote
    post_res = client.post("/posts", json={
        "title": "Regression Post for Cascade Test",
        "content": "Testing database cascade integrity on account deletion",
        "category": "General"
    }, headers=headers)
    assert post_res.status_code == 201

    # 4. Create an AI Session
    ai_res = client.post("/ai/sessions", json={
        "title": "Cascade AI Test",
        "system_prompt": "Test"
    }, headers=headers)
    assert ai_res.status_code == 201

    # 5. Perform Account Deletion (Must succeed without 500 error)
    del_res = client.delete("/users/me", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"

    # Verify user record is gone
    db = SessionLocal()
    deleted_user = db.query(models.User).filter(models.User.id == user_id).first()
    assert deleted_user is None
    db.close()


# ---------------------------------------------------------------------------
# Test 3: Email Update Triggers Re-Verification Flow
# ---------------------------------------------------------------------------
def test_email_update_reverification_lifecycle():
    user_id, old_email, headers = create_test_user(role="student")
    rand = secrets.token_hex(4)
    new_email = f"new_email_{rand}@cyberlearn.io"

    # Update email
    upd_res = client.put("/users/me", json={"email": new_email}, headers=headers)
    assert upd_res.status_code == 200
    assert upd_res.json()["email"] == new_email
    assert upd_res.json()["is_verified"] is False

    # Check verification token in DB
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.id == user_id).first()
    assert user.is_verified is False
    assert user.verification_token is not None
    v_token = user.verification_token
    db.close()

    # Complete email verification
    verify_res = client.get(f"/auth/verify-email?token={v_token}")
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "success"

    # Verify account is now active
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.id == user_id).first()
    assert user.is_verified is True
    assert user.verification_token is None
    db.close()


# ---------------------------------------------------------------------------
# Test 4: Post Upvote Idempotency & Toggle (Prevents Spam Inflation)
# ---------------------------------------------------------------------------
def test_post_upvoting_idempotency_and_toggle():
    _, _, author_headers = create_test_user(role="student")
    _, _, voter_headers = create_test_user(role="student")

    # Create post (author auto-upvotes to 1)
    post_res = client.post("/posts", json={
        "title": "Idempotent Upvoting Test",
        "content": "Checking vote toggle mechanisms",
        "category": "Writeups"
    }, headers=author_headers)
    assert post_res.status_code == 201
    post_id = post_res.json()["id"]
    initial_upvotes = post_res.json()["upvotes"]

    # Voter casts 1st upvote -> upvotes should increase by 1
    vote1 = client.post(f"/posts/{post_id}/upvote", headers=voter_headers)
    assert vote1.status_code == 200
    assert vote1.json()["upvotes"] == initial_upvotes + 1
    assert vote1.json()["has_upvoted"] is True

    # Voter clicks upvote AGAIN -> toggles off, upvotes should decrease by 1
    vote2 = client.post(f"/posts/{post_id}/upvote", headers=voter_headers)
    assert vote2.status_code == 200
    assert vote2.json()["upvotes"] == initial_upvotes
    assert vote2.json()["has_upvoted"] is False


# ---------------------------------------------------------------------------
# Test 5: Course Progress Validation & Bounds Check
# ---------------------------------------------------------------------------
def test_progress_update_validation_bounds():
    _, _, headers = create_test_user(role="student")

    # 1. Invalid completion percentage > 100
    res_high = client.post("/courses/progress", json={
        "course_id": "web-security-fundamentals",
        "lesson_id": "web-intro",
        "status": "completed",
        "completion_pct": 150.0
    }, headers=headers)
    assert res_high.status_code == 422

    # 2. Invalid completion percentage < 0
    res_neg = client.post("/courses/progress", json={
        "course_id": "web-security-fundamentals",
        "lesson_id": "web-intro",
        "status": "completed",
        "completion_pct": -25.0
    }, headers=headers)
    assert res_neg.status_code == 422

    # 3. Invalid status string
    res_status = client.post("/courses/progress", json={
        "course_id": "web-security-fundamentals",
        "lesson_id": "web-intro",
        "status": "invalid_status_value",
        "completion_pct": 50.0
    }, headers=headers)
    assert res_status.status_code == 422

    # 4. Valid progress payload
    res_valid = client.post("/courses/progress", json={
        "course_id": "web-security-fundamentals",
        "lesson_id": "web-intro",
        "status": "completed",
        "completion_pct": 100.0
    }, headers=headers)
    assert res_valid.status_code == 200


# ---------------------------------------------------------------------------
# Test 6: Batch Capacity Enforcement & Duplicate Protection
# ---------------------------------------------------------------------------
def test_batch_capacity_and_duplicate_protection():
    _, _, inst_headers = create_test_user(role="instructor")
    _, _, s1_headers = create_test_user(role="student")
    _, _, s2_headers = create_test_user(role="student")

    # Create batch with strict capacity of 1
    batch_res = client.post("/batches", json={
        "name": "Strict Single-Seat Cohort",
        "description": "Max 1 student",
        "max_students": 1
    }, headers=inst_headers)
    assert batch_res.status_code == 201
    batch_code = batch_res.json()["batch_code"]

    # Student 1 joins -> Success
    join1 = client.post(f"/batches/{batch_code}/join", headers=s1_headers)
    assert join1.status_code == 200
    assert join1.json()["status"] == "success"

    # Student 1 tries joining AGAIN -> already_enrolled response
    join1_dup = client.post(f"/batches/{batch_code}/join", headers=s1_headers)
    assert join1_dup.status_code == 200
    assert join1_dup.json()["status"] == "already_enrolled"

    # Student 2 tries joining full batch -> 400 Bad Request
    join2 = client.post(f"/batches/{batch_code}/join", headers=s2_headers)
    assert join2.status_code == 400
    assert "capacity" in join2.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Test 7: Socratic Hint XP Deductions & Boundaries
# ---------------------------------------------------------------------------
def test_socratic_hint_xp_deduction():
    user_id, _, headers = create_test_user(role="student", xp=100)

    # 1. Unlock hint with cost 30 (User has 100 XP -> 70 XP remaining)
    hint_res = client.post("/labs/linux-navigation/hints/unlock", json={
        "level": 1,
        "cost": 30
    }, headers=headers)
    assert hint_res.status_code == 200
    assert hint_res.json()["unlocked"] is True
    assert hint_res.json()["remaining_xp"] == 70

    # 2. Reject hint if cost exceeds remaining XP (cost 100 > 70)
    hint_excess = client.post("/labs/linux-navigation/hints/unlock", json={
        "level": 2,
        "cost": 100
    }, headers=headers)
    assert hint_excess.status_code == 400
    assert "insufficient xp" in hint_excess.json()["detail"].lower()
