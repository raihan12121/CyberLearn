import sys
import os
import uuid

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
    print("RUNNING GOOGLE AVATAR IMPORT & PROFILE UPDATE TEST SUITE")
    print("=" * 65)

    uid = uuid.uuid4().hex[:6]
    google_email = f"operative_{uid}@gmail.com"
    google_name = "Alex Vance"
    google_picture = "https://lh3.googleusercontent.com/a/ACg8ocK-example-avatar-photo"

    # 1. Test Social Login with Google importing profile picture from Gmail
    print("\n[1] Testing Google Social Login importing profile picture from Gmail...")
    social_res = client.post("/auth/social-login", json={
        "provider": "google",
        "email": google_email,
        "full_name": google_name,
        "avatar_url": google_picture,
        "provider_token": "google_oauth_token_valid_secure_32_characters_long_12345"
    })
    assert social_res.status_code == 200, f"Social login failed: {social_res.text}"
    token = social_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify user profile in /auth/me
    me_res = client.get("/auth/me", headers=headers)
    assert me_res.status_code == 200
    user = me_res.json()
    assert user["email"] == google_email
    assert user["full_name"] == google_name
    assert user["avatar_url"] == google_picture, f"Expected {google_picture}, got {user['avatar_url']}"
    print(f"  -> SUCCESS: Google profile picture imported automatically from Gmail: {user['avatar_url']}")

    # 2. Test Custom Photo Upload (Base64 / Image URL)
    print("\n[2] Testing Add / Upload Custom Photo via POST /users/me/avatar...")
    custom_photo_data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    upload_res = client.post("/users/me/avatar", json={"avatar_url": custom_photo_data}, headers=headers)
    assert upload_res.status_code == 200, f"Avatar upload failed: {upload_res.text}"
    updated_user = upload_res.json()
    assert updated_user["avatar_url"] == custom_photo_data
    print("  -> SUCCESS: Custom avatar photo uploaded and saved successfully.")

    # 3. Test Photo Removal
    print("\n[3] Testing Remove Photo via DELETE /users/me/avatar...")
    remove_res = client.delete("/users/me/avatar", headers=headers)
    assert remove_res.status_code == 200
    cleared_user = remove_res.json()
    assert cleared_user["avatar_url"] is None
    print("  -> SUCCESS: Avatar photo removed (reverted to default initials/preset).")

    # 4. Test Changing Name and Unique Username
    print("\n[4] Testing Name and Unique Username Updates via PUT /users/me...")
    new_handle = f"cyber_operative_{uid}"
    new_name = "Alexandria Vance, CISSP"
    new_bio = "Cyber Threat Intelligence Specialist | Penetration Tester"

    update_res = client.put("/users/me", json={
        "full_name": new_name,
        "username": new_handle,
        "bio": new_bio,
        "avatar_url": google_picture # Setting back Google picture
    }, headers=headers)
    assert update_res.status_code == 200, f"Profile update failed: {update_res.text}"
    profile_updated = update_res.json()
    assert profile_updated["full_name"] == new_name
    assert profile_updated["username"] == new_handle
    assert profile_updated["bio"] == new_bio
    assert profile_updated["avatar_url"] == google_picture
    print(f"  -> SUCCESS: Name and Unique Username updated: @{new_handle} ('{new_name}')")

    # 5. Test Username Uniqueness Conflict Rejection
    print("\n[5] Testing Unique Username Conflict Rejection...")
    # Register another user
    other_uid = uuid.uuid4().hex[:6]
    other_email = f"other_{other_uid}@cyberlearn.io"
    other_pass = "Password123!"
    other_res = client.post("/auth/register", json={
        "email": other_email,
        "password": other_pass,
        "full_name": "Other User",
        "username": f"other_handle_{other_uid}"
    })
    if "access_token" in other_res.json():
        other_token = other_res.json()["access_token"]
    else:
        other_token = client.post("/auth/login", json={"email": other_email, "password": other_pass}).json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # Attempt to take new_handle
    conflict_res = client.put("/users/me", json={
        "username": new_handle
    }, headers=other_headers)
    assert conflict_res.status_code == 400
    print(f"  -> SUCCESS: Duplicate username change correctly rejected: {conflict_res.json()['detail']}")

    # 6. Test Public Portfolio resolves with updated username and Google avatar
    print(f"\n[6] Testing Public Portfolio at /users/{new_handle}/public-profile...")
    public_res = client.get(f"/users/{new_handle}/public-profile")
    assert public_res.status_code == 200
    pub_data = public_res.json()
    assert pub_data["username"] == new_handle
    assert pub_data["full_name"] == new_name
    assert pub_data["avatar_url"] == google_picture
    print(f"  -> SUCCESS: Public portfolio displaying @{new_handle} with avatar: {pub_data['avatar_url']}")

    print("\n" + "=" * 65)
    print("ALL GOOGLE AVATAR IMPORT & PROFILE UPDATE TESTS PASSED (100%)")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()
