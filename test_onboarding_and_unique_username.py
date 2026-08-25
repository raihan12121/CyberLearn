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
    print("RUNNING ONBOARDING & UNIQUE USERNAME TEST SUITE")
    print("=" * 65)

    import uuid
    uid = uuid.uuid4().hex[:6]
    email = f"new_cadet_{uid}@cyberlearn.io"
    password = "Password123!"
    reg_res = client.post("/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "New Cadet",
        "username": f"temp_cadet_{uid}"
    })
    token = reg_res.json()["access_token"] if reg_res.status_code == 200 else client.post("/auth/login", json={"email": email, "password": password}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[1] New User Registered.")

    # 2. Check initial user state (is_onboarded should be False)
    me_res = client.get("/auth/me", headers=headers)
    assert me_res.status_code == 200
    user_data = me_res.json()
    assert user_data["is_onboarded"] is False
    print(f"[2] Initial user status verified: is_onboarded={user_data['is_onboarded']}, xp={user_data['xp']}")

    # 3. Test Username Availability Checker
    print("\n[3] Testing GET /auth/check-username endpoint...")
    
    # 3a. Taken username
    check_taken = client.get(f"/auth/check-username?username=temp_cadet_{uid}")
    assert check_taken.status_code == 200
    assert check_taken.json()["available"] is False
    print("  -> Taken username correctly marked unavailable:", check_taken.json()["message"])

    # 3b. Invalid characters
    check_invalid = client.get("/auth/check-username?username=bad@handle!#")
    assert check_invalid.status_code == 200
    assert check_invalid.json()["available"] is False
    print("  -> Invalid characters correctly rejected:", check_invalid.json()["message"])

    # 3c. Too short
    check_short = client.get("/auth/check-username?username=ab")
    assert check_short.status_code == 200
    assert check_short.json()["available"] is False
    print("  -> Short username correctly rejected:", check_short.json()["message"])

    # 3d. Valid and available username
    unique_handle = f"shadow_phantom_{uid}"
    check_avail = client.get(f"/auth/check-username?username={unique_handle}")
    assert check_avail.status_code == 200
    assert check_avail.json()["available"] is True
    print(f"  -> Unique handle '{unique_handle}' verified available!")

    # 4. Complete Onboarding with chosen unique username and preferences
    print("\n[4] Submitting POST /auth/complete-onboarding...")
    onboarding_res = client.post("/auth/complete-onboarding", json={
        "username": unique_handle,
        "full_name": "Shadow Operative",
        "primary_focus": "Ethical Hacking & Red Team",
        "experience_level": "intermediate",
        "bio": "Red Teaming and Penetration Testing enthusiast.",
        "avatar_url": "avatar-phantom"
    }, headers=headers)
    assert onboarding_res.status_code == 200, f"Onboarding failed: {onboarding_res.text}"
    onboarded_user = onboarding_res.json()

    assert onboarded_user["username"] == unique_handle
    assert onboarded_user["full_name"] == "Shadow Operative"
    assert onboarded_user["is_onboarded"] is True
    assert onboarded_user["primary_focus"] == "Ethical Hacking & Red Team"
    assert onboarded_user["experience_level"] == "intermediate"
    assert onboarded_user["xp"] == 100 # +100 XP Initiate Bonus
    print(f"  -> SUCCESS: Onboarding completed! Handle: @{onboarded_user['username']}, XP: {onboarded_user['xp']}, Focus: {onboarded_user['primary_focus']}")

    # 5. Verify Achievement Badge awarded
    db = SessionLocal()
    achievement = db.query(models.Achievement).filter(
        models.Achievement.user_id == onboarded_user["id"],
        models.Achievement.badge_name == "Cyber Initiate"
    ).first()
    assert achievement is not None, "Initiate achievement badge was not awarded!"
    print(f"  -> SUCCESS: Achievement badge '{achievement.badge_name}' stored in database.")
    db.close()

    # 6. Verify Public Profile resolves with the new unique username
    print(f"\n[5] Testing Public Portfolio at /users/{unique_handle}/public-profile...")
    public_res = client.get(f"/users/{unique_handle}/public-profile")
    assert public_res.status_code == 200
    pub_data = public_res.json()
    assert pub_data["username"] == unique_handle
    assert pub_data["full_name"] == "Shadow Operative"
    print(f"  -> SUCCESS: Public portfolio successfully resolved for @{unique_handle}!")

    print("\n" + "=" * 65)
    print("ALL ONBOARDING & UNIQUE USERNAME TESTS PASSED SUCCESSFULLY (100%)")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()
