"""
Watches for Firestore rules to be published and immediately triggers full sync.
"""

import time
import httpx
from sync_to_firestore import sync_all, FIREBASE_API_KEY, BASE_FIRESTORE_URL

def check_permission():
    url = f"{BASE_FIRESTORE_URL}/_health_check/ping?key={FIREBASE_API_KEY}"
    payload = {"fields": {"ping": {"stringValue": "pong"}}}
    try:
        res = httpx.patch(url, json=payload, timeout=5.0)
        return res.status_code == 200
    except Exception:
        return False

def main():
    print("Checking if Firestore Rules are published...")
    if check_permission():
        print(">>> SUCCESS: Firestore is UNLOCKED! Starting automatic sync now... <<<")
        sync_all()
    else:
        print(">>> 403 Forbidden: Rules are still locked. Please click the 'Rules' tab in Firebase Console, paste 'allow read, write: if true;' and click Publish. <<<")

if __name__ == "__main__":
    main()
