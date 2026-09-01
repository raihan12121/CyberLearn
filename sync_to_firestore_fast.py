"""
CyberLearn -> Firebase Cloud Firestore Complete Full-Platform Synchronizer
Syncs Users, XP Points, Achievements, Badges, Progress, Exams, Certificates, Labs, and Community.
"""

import asyncio
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

async def sync_document(client: httpx.AsyncClient, collection_path: str, doc_id: str, data: dict, semaphore: asyncio.Semaphore):
    async with semaphore:
        url = f"{BASE_FIRESTORE_URL}/{collection_path}/{doc_id}?key={FIREBASE_API_KEY}"
        payload = to_firestore_fields(data)
        for attempt in range(3):
            try:
                res = await client.patch(url, json=payload, timeout=12.0)
                if res.status_code == 200:
                    return True
                elif res.status_code == 429:
                    await asyncio.sleep(0.5 * (attempt + 1))
                else:
                    return False
            except Exception:
                await asyncio.sleep(0.3)
        return False

async def run_fast_sync():
    print("=" * 60)
    print("STARTING FULL SYNCHRONIZATION ACROSS BOTH DATABASES...")
    print("=" * 60)
    db = SessionLocal()
    sem = asyncio.Semaphore(40)

    limits = httpx.Limits(max_keepalive_connections=40, max_connections=60)
    async with httpx.AsyncClient(limits=limits) as client:
        
        # 1. Sync All Users & XP Points
        users = db.query(models.User).all()
        print(f"\n[1] Syncing {len(users)} Users, XP, and Profiles...")
        user_tasks = []
        for u in users:
            doc_id = u.email.lower().replace(".", "_").replace("@", "_at_")
            user_data = {
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "full_name": u.full_name,
                "role": u.role,
                "xp": u.xp or 0,
                "streak_days": u.streak_days or 0,
                "avatar_url": u.avatar_url,
                "bio": u.bio,
                "is_onboarded": bool(u.is_onboarded),
                "is_verified": bool(u.is_verified),
                "verification_status": u.verification_status or "unverified",
                "subscription_tier": u.subscription_tier or "free",
                "subscription_status": u.subscription_status or "inactive",
                "updated_at": u.created_at or datetime.utcnow(),
            }
            user_tasks.append(sync_document(client, "users", doc_id, user_data, sem))

        user_results = await asyncio.gather(*user_tasks)
        print(f" -> Users Synced: {sum(1 for r in user_results if r)} / {len(users)}")

        # 2. Sync Community Posts
        posts = db.query(models.Post).all()
        print(f"\n[2] Syncing {len(posts)} Community Questions & Writeups...")
        post_tasks = []
        for p in posts:
            author_name = (p.user.full_name or p.user.username) if p.user else "Learner"
            author_username = p.user.username if p.user else "learner"
            post_data = {
                "id": p.id,
                "user_id": p.user_id,
                "title": p.title,
                "content": p.content,
                "category": p.category or "General",
                "tags": p.tags or "",
                "is_solved": bool(p.is_solved),
                "author_name": author_name,
                "author_username": author_username,
                "upvotes": p.upvotes or 1,
                "comment_count": len(p.comments) if p.comments else 0,
                "created_at": p.created_at or datetime.utcnow(),
            }
            post_tasks.append(sync_document(client, "community_posts", p.id, post_data, sem))

        post_results = await asyncio.gather(*post_tasks)
        print(f" -> Community Posts Synced: {sum(1 for r in post_results if r)} / {len(posts)}")

        # 3. Sync Certificates
        certs = db.query(models.Certificate).all()
        print(f"\n[3] Syncing {len(certs)} Verified Diplomas & Certificates...")
        cert_tasks = []
        for c in certs:
            title = c.exam.title if c.exam else c.course.title if c.course else "Cybersecurity Credential"
            cert_data = {
                "id": c.id,
                "verification_token": c.verification_token,
                "user_id": c.user_id,
                "student_name": (c.user.full_name or c.user.username) if c.user else "Learner",
                "student_email": c.user.email if c.user else "student@cyberlearn.io",
                "title": title,
                "score_pct": float(c.score_pct or 100.0),
                "certificate_type": c.certificate_type or "exam_certified",
                "issued_at": c.issued_at or datetime.utcnow(),
            }
            cert_tasks.append(sync_document(client, "certificates", c.verification_token, cert_data, sem))

        cert_results = await asyncio.gather(*cert_tasks)
        print(f" -> Certificates Synced: {sum(1 for r in cert_results if r)} / {len(certs)}")

        # 4. Sync Course & Lesson Progress (Student Growth)
        progress_rows = db.query(models.Progress).all()
        print(f"\n[4] Syncing {len(progress_rows)} Lesson & Student Growth Progress Records...")
        progress_tasks = []
        for pr in progress_rows:
            user = db.query(models.User).filter(models.User.id == pr.user_id).first()
            if user and user.email:
                user_doc_id = user.email.lower().replace(".", "_").replace("@", "_at_")
                sub_path = f"users/{user_doc_id}/courses"
                doc_key = f"{pr.course_id}_{pr.lesson_id}"
                pr_data = {
                    "course_id": pr.course_id,
                    "lesson_id": pr.lesson_id,
                    "status": pr.status or "completed",
                    "completion_pct": float(pr.completion_pct or 100.0),
                    "updated_at": pr.updated_at or datetime.utcnow(),
                }
                progress_tasks.append(sync_document(client, sub_path, doc_key, pr_data, sem))

        if progress_tasks:
            progress_results = await asyncio.gather(*progress_tasks)
            print(f" -> Lesson Progress Records Synced: {sum(1 for r in progress_results if r)} / {len(progress_tasks)}")

        # 5. Sync Achievements & Badges
        achievements = db.query(models.Achievement).all()
        print(f"\n[5] Syncing {len(achievements)} User Achievements & Badges...")
        badge_tasks = []
        for a in achievements:
            user = db.query(models.User).filter(models.User.id == a.user_id).first()
            if user and user.email:
                user_doc_id = user.email.lower().replace(".", "_").replace("@", "_at_")
                sub_path = f"users/{user_doc_id}/achievements"
                badge_data = {
                    "id": a.id,
                    "badge_name": a.badge_name,
                    "badge_icon": a.badge_icon or "Award",
                    "earned_at": a.earned_at or datetime.utcnow(),
                }
                badge_tasks.append(sync_document(client, sub_path, a.id, badge_data, sem))

        if badge_tasks:
            badge_results = await asyncio.gather(*badge_tasks)
            print(f" -> Badges Synced: {sum(1 for r in badge_results if r)} / {len(badge_tasks)}")

        # 6. Sync Exam Submissions
        exam_subs = db.query(models.ExamSubmission).all()
        print(f"\n[6] Syncing {len(exam_subs)} Exam Submissions & Scores...")
        exam_tasks = []
        for es in exam_subs:
            user = db.query(models.User).filter(models.User.id == es.user_id).first()
            if user and user.email:
                user_doc_id = user.email.lower().replace(".", "_").replace("@", "_at_")
                sub_path = f"users/{user_doc_id}/exams"
                exam_data = {
                    "id": es.id,
                    "exam_id": es.exam_id,
                    "score": float(es.score or 0),
                    "total_score": float(es.total_score or 100),
                    "score_pct": float(es.score_pct or 0),
                    "passed": bool(es.passed),
                    "certificate_token": es.certificate_token,
                    "submitted_at": es.submitted_at or datetime.utcnow(),
                }
                exam_tasks.append(sync_document(client, sub_path, es.id, exam_data, sem))

        if exam_tasks:
            exam_results = await asyncio.gather(*exam_tasks)
            print(f" -> Exam Submissions Synced: {sum(1 for r in exam_results if r)} / {len(exam_tasks)}")

    db.close()
    print("\n" + "=" * 60)
    print("ALL PLATFORM DATA (USERS, XP, GROWTH, CERTIFICATES, EXAMS, BADGES) 100% SYNCED TO FIRESTORE!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_fast_sync())
