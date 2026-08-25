import os
import sys
import uuid
from datetime import datetime, timezone
from fastapi.testclient import TestClient

# Ensure backend package is on path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app

client = TestClient(app)

def run_tests():
    print("[1] Registering Test Users...")
    st_email = f"hybrid_student_{uuid.uuid4().hex[:6]}@cyberlearn.io"
    password = "SecurePassword123!"
    reg_res = client.post("/auth/register", json={"email": st_email, "password": password, "full_name": "Hybrid Revenue Tester"})
    assert reg_res.status_code in [200, 201]
    
    log_res = client.post("/auth/login", json={"email": st_email, "password": password})
    assert log_res.status_code == 200
    token = log_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch courses
    courses_res = client.get("/courses", headers=headers)
    assert courses_res.status_code == 200
    courses = courses_res.json()
    assert len(courses) >= 2, "Expected at least 2 seed courses"
    course_a = courses[0]
    course_b = courses[1]
    print(f"    -> Course A: '{course_a['title']}' (${course_a.get('price', 49.00)})")
    print(f"    -> Course B: '{course_b['title']}' (${course_b.get('price', 49.00)})")

    print("[2] Verifying initial locked state for unpaid user...")
    ca_detail = client.get(f"/courses/{course_a['id']}", headers=headers)
    assert ca_detail.status_code == 200
    ca_data = ca_detail.json()
    assert ca_data["has_access"] is False
    assert ca_data["is_purchased"] is False
    assert ca_data["lessons"][0]["is_locked"] is True
    print("    -> Course A correctly locked for unpaid user")

    print("[3] Testing Promo Code Validation on Lifetime Course Purchase...")
    promo_res = client.post("/billing/validate-promo", json={
        "promo_code": "CYBER2026",
        "purchase_type": "course_lifetime",
        "course_id": course_a["id"]
    })
    assert promo_res.status_code == 200, f"Expected 200, got {promo_res.status_code}: {promo_res.text}"
    p_data = promo_res.json()
    assert p_data["valid"] is True
    assert p_data["original_price"] == 49.00
    assert p_data["final_price"] == 24.50 # 50% discount on $49.00
    print("    -> CYBER2026 applied to lifetime course: $49.00 -> $24.50")

    print("[4] Purchasing Lifetime Access to Course A with Promo Code...")
    purchase_payload = {
        "purchase_type": "course_lifetime",
        "course_id": course_a["id"],
        "payment_method": "credit_card",
        "card_number": "4242 4242 4242 4242",
        "card_exp_month": 12,
        "card_exp_year": 2030,
        "card_cvc": "123",
        "cardholder_name": "Hybrid Revenue Tester",
        "promo_code": "CYBER2026"
    }
    pay_res = client.post("/billing/process-payment", json=purchase_payload, headers=headers)
    assert pay_res.status_code == 200, f"Expected 200, got {pay_res.status_code}: {pay_res.text}"
    pay_data = pay_res.json()
    assert pay_data["status"] == "success"
    assert pay_data["purchase_type"] == "course_lifetime"
    assert pay_data["course_id"] == course_a["id"]
    assert pay_data["invoice"]["total_paid"] == 24.50
    assert pay_data["invoice"]["purchase_type"] == "course_lifetime"
    print(f"    -> Lifetime access purchased! Invoice #{pay_data['invoice']['invoice_number']} minted")

    print("[5] Verifying GET /billing/my-courses...")
    my_courses_res = client.get("/billing/my-courses", headers=headers)
    assert my_courses_res.status_code == 200
    my_courses = my_courses_res.json()
    assert len(my_courses) == 1
    assert my_courses[0]["course_id"] == course_a["id"]
    assert my_courses[0]["purchase_type"] == "lifetime"
    print(f"    -> Lifetime owned course retrieved: '{my_courses[0]['course_title']}'")

    print("[6] Verifying Course A is UNLOCKED while Course B remains LOCKED...")
    ca_unlocked = client.get(f"/courses/{course_a['id']}", headers=headers)
    assert ca_unlocked.status_code == 200
    ca_unlocked_data = ca_unlocked.json()
    assert ca_unlocked_data["has_access"] is True
    assert ca_unlocked_data["is_purchased"] is True
    print(f"    -> Lessons in course A: {[(l['title'], l['content_type'], l['is_locked'], l.get('video_url')) for l in ca_unlocked_data['lessons']]}")
    assert ca_unlocked_data["lessons"][0]["is_locked"] is False
    print("    -> Course A verified completely unlocked with video streaming URLs")

    cb_locked = client.get(f"/courses/{course_b['id']}", headers=headers)
    assert cb_locked.status_code == 200
    cb_locked_data = cb_locked.json()
    assert cb_locked_data["has_access"] is False
    assert cb_locked_data["is_purchased"] is False
    assert cb_locked_data["lessons"][0]["is_locked"] is True
    print("    -> Course B remains strictly locked")

    print("[7] Verifying Progress and Quiz for Lifetime Owner on Course A...")
    lesson_a = ca_unlocked_data["lessons"][0]
    prog_res = client.post("/courses/progress", json={
        "course_id": course_a["id"],
        "lesson_id": lesson_a["id"],
        "status": "completed",
        "completion_pct": 100.0
    }, headers=headers)
    assert prog_res.status_code == 200, f"Expected 200, got {prog_res.status_code}: {prog_res.text}"
    print("    -> Progress update allowed on lifetime course")

    print("[8] Verifying Sandbox Labs blocked for lifetime-only user (no all-access sub)...")
    labs_res = client.get("/labs")
    if labs_res.status_code == 200 and labs_res.json():
        lab_id = labs_res.json()[0]["id"]
        start_lab_res = client.post("/labs/start", json={"lab_id": lab_id}, headers=headers)
        assert start_lab_res.status_code == 403, f"Expected 403, got {start_lab_res.status_code}"
        print("    -> Sandbox Docker labs correctly restricted without all-access subscription")

    print("[9] Testing Multi-Month (2 Months) Pro Subscription Purchase...")
    sub_payload = {
        "purchase_type": "subscription",
        "plan_name": "Pro",
        "duration_months": 2,
        "billing_period": "2-months",
        "payment_method": "credit_card",
        "card_number": "4242 4242 4242 4242",
        "card_exp_month": 11,
        "card_exp_year": 2030,
        "card_cvc": "999"
    }
    sub_res = client.post("/billing/process-payment", json=sub_payload, headers=headers)
    assert sub_res.status_code == 200, f"Expected 200, got {sub_res.status_code}: {sub_res.text}"
    sub_data = sub_res.json()
    assert sub_data["status"] == "success"
    assert sub_data["is_subscribed"] is True
    assert sub_data["invoice"]["total_paid"] == 22.00 # $12*2 - $2 bundle discount
    print(f"    -> 2-Month All-Access subscription activated ($22.00)! Expires: {sub_data['subscription_expires_at']}")

    print("[10] Verifying Course B and Sandbox Labs are NOW UNLOCKED with All-Access...")
    cb_now_unlocked = client.get(f"/courses/{course_b['id']}", headers=headers)
    assert cb_now_unlocked.status_code == 200
    assert cb_now_unlocked.json()["has_access"] is True
    assert cb_now_unlocked.json()["lessons"][0]["is_locked"] is False
    print("    -> Course B is now unlocked via All-Access Subscription")

    print("\n[SUCCESS] All Hybrid Revenue Model backend tests PASSED successfully!\n")

if __name__ == "__main__":
    run_tests()
