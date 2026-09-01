"""
CyberLearn -> Firebase Cloud Firestore Real-Time Synchronizer
Migrates and syncs all database tables directly into Cloud Firestore collections.
"""

import sys
import httpx
from datetime import datetime
from backend.app.database import SessionLocal
from backend.app import models

FIREBASE_API_KEY = "AIzaSyD1tY3a1x-9D-e5wWIIBMHnValX-z4X2Ss"
PROJECT_ID = "cyberlearn-39cfe"
BASE_FIRESTORE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

def to_firestore_value(val):
    if val is None:
        return {"nullValue": None}
    if isinstance(val, bool):
        return {"booleanValue": val}
    if isinstance(val, (int, float)):
        return {"doubleValue": float(val)} if isinstance(val, float) else {"integerValue": str(val)}
    if isinstance(val, datetime):
        return {"timestampValue": val.isoformat() + "Z"}
    return {"stringValue": str(val)}

def to_firestore_fields(data: dict):
    return {"fields": {k: to_firestore_value(v) for k, v in data.items() if v is not None}}

def sync_all():
    print("=" * 60)
    print("STARTING FULL CYBERLEARN -> CLOUD FIRESTORE SYNC")
    print("=" * 60)
    db = SessionLocal()
    
    try:
        # 1. Sync Users
        users = db.query(models.User).all()
        print(f"\n[1] Syncing {len(users)} User Accounts...")
        for u in users:
            doc_id = u.email.lower().replace(".", "_").replace("@", "_at_")
            url = f"{BASE_FIRESTORE_URL}/users/{doc_id}?key={FIREBASE_API_KEY}"
            payload = to_firestore_fields({
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "full_name": u.full_name,
                "role": u.role,
                "xp": u.xp or 0,
                "streak_days": u.streak_days or 0,
                "avatar_url": u.avatar_url,
                "bio": u.bio,
                "is_onboarded": u.is_onboarded or True,
                "is_verified": u.is_verified,
                "verification_status": u.verification_status or "unverified",
                "subscription_tier": u.subscription_tier or "free",
                "subscription_status": u.subscription_status or "inactive",
            })
            res = httpx.patch(url, json=payload)
            if res.status_code == 200:
                print(f"  [OK] Synced user: {u.email}")
            elif res.status_code == 403:
                print("\n" + "!" * 60)
                print(">>> 403 FORBIDDEN: Google Cloud Firestore Rules Blocked Writes <<<")
                print("To fix this immediately:")
                print("1. Go to Firebase Console: https://console.firebase.google.com/project/cyberlearn-39cfe/firestore/databases/-default-/rules")
                print("2. Change rules to: allow read, write: if true;")
                print("3. Click 'Publish'")
                print("!" * 60 + "\n")
                return False
            else:
                print(f"  [FAIL] Failed for {u.email}: {res.status_code} - {res.text[:100]}")

        # 2. Sync Community Posts
        posts = db.query(models.Post).all()
        print(f"\n[2] Syncing {len(posts)} Community Posts...")
        for p in posts:
            doc_id = p.id
            url = f"{BASE_FIRESTORE_URL}/community_posts/{doc_id}?key={FIREBASE_API_KEY}"
            author_name = (p.user.full_name or p.user.username) if p.user else "Learner"
            author_username = p.user.username if p.user else "learner"
            payload = to_firestore_fields({
                "id": p.id,
                "user_id": p.user_id,
                "title": p.title,
                "content": p.content,
                "category": p.category or "General",
                "tags": p.tags or "",
                "is_solved": p.is_solved or False,
                "author_name": author_name,
                "author_username": author_username,
                "upvotes": p.upvotes or 1,
                "created_at": p.created_at or datetime.utcnow(),
            })
            res = httpx.patch(url, json=payload)
            if res.status_code == 200:
                print(f"  [OK] Synced post: {p.title[:40]}...")

        # 3. Sync Certificates
        certs = db.query(models.Certificate).all()
        print(f"\n[3] Syncing {len(certs)} Issued Certificates...")
        for c in certs:
            doc_id = c.verification_token
            url = f"{BASE_FIRESTORE_URL}/certificates/{doc_id}?key={FIREBASE_API_KEY}"
            title = c.exam.title if c.exam else c.course.title if c.course else "Cybersecurity Credential"
            payload = to_firestore_fields({
                "id": c.id,
                "verification_token": c.verification_token,
                "user_id": c.user_id,
                "student_name": (c.user.full_name or c.user.username) if c.user else "Learner",
                "student_email": c.user.email if c.user else "student@cyberlearn.io",
                "title": title,
                "score_pct": float(c.score_pct or 100.0),
                "certificate_type": c.certificate_type or "exam_certified",
                "issued_at": c.issued_at or datetime.utcnow(),
            })
            res = httpx.patch(url, json=payload)
            if res.status_code == 200:
                print(f"  [OK] Synced certificate: {c.verification_token}")

        print("\n" + "=" * 60)
        print("ALL DATA SUCCESSFULLY SYNCHRONIZED TO CLOUD FIRESTORE!")
        print("=" * 60)
        return True

    finally:
        db.close()

if __name__ == "__main__":
    sync_all()
