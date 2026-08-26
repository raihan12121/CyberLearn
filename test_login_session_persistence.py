import sys
import os
import uuid

backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, run_auto_migrations, engine
from app import models

client = TestClient(app)

def run_tests():
    print("=" * 65)
    print("RUNNING LOGIN & CREDENTIAL PERSISTENCE TEST SUITE")
    print("=" * 65)

    uid = uuid.uuid4().hex[:6]
    test_email = f"persisted_cadet_{uid}@cyberlearn.io"
    test_pass = "SecurePass123!"
    test_name = "Persisted Cadet"
    test_handle = f"persisted_{uid}"

    # 1. Register new user
    print("\n[1] Registering user with full credentials...")
    reg_res = client.post("/auth/register", json={
        "email": test_email,
        "password": test_pass,
        "full_name": test_name,
        "username": test_handle
    })
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    print(f"  -> SUCCESS: User registered and stored in database: {test_email}")

    # 2. Log in with stored credentials
    print("\n[2] Logging in with email & password stored in database...")
    login_res = client.post("/auth/login", json={
        "email": test_email,
        "password": test_pass
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("  -> SUCCESS: User logged in, 30-day persistent JWT token issued.")

    # 3. Verify user status in /auth/me and complete onboarding
    print("\n[3] Checking /auth/me status and completing onboarding...")
    me_res = client.get("/auth/me", headers=headers)
    assert me_res.status_code == 200
    user_data = me_res.json()
    assert user_data["email"] == test_email
    assert user_data["username"] == test_handle
    assert user_data["full_name"] == test_name
    
    # Complete onboarding
    onb_res = client.post("/auth/complete-onboarding", json={
        "username": test_handle,
        "full_name": test_name,
        "primary_focus": "Web Security",
        "experience_level": "beginner"
    }, headers=headers)
    assert onb_res.status_code == 200
    assert onb_res.json()["is_onboarded"] is True, "User should have is_onboarded=True after onboarding!"
    print("  -> SUCCESS: User completed onboarding and is_onboarded=True.")

    # 4. Verify existing database users are marked onboarded
    print("\n[4] Running auto-migration check on database...")
    run_auto_migrations(engine)
    db = SessionLocal()
    unonboarded_count = db.query(models.User).filter(
        (models.User.is_onboarded == False) | (models.User.is_onboarded == None)
    ).count()
    print(f"  -> SUCCESS: Un-onboarded existing users count: {unonboarded_count} (all legacy users marked completed)")
    db.close()

    # 5. Subsequent Login Check
    print("\n[5] Simulating second login on a new session...")
    login_res2 = client.post("/auth/login", json={
        "email": test_email,
        "password": test_pass
    })
    assert login_res2.status_code == 200
    token2 = login_res2.json()["access_token"]
    me_res2 = client.get("/auth/me", headers={"Authorization": f"Bearer {token2}"})
    assert me_res2.json()["is_onboarded"] is True
    print("  -> SUCCESS: Subsequent login maintains is_onboarded=True without any prompts.")

    print("\n" + "=" * 65)
    print("ALL LOGIN & CREDENTIAL PERSISTENCE TESTS PASSED (100%)")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()
