import os
import sys
from fastapi.testclient import TestClient

# Ensure backend package is on path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.database import Base, engine

client = TestClient(app)

def run_tests():
    print("[1] Validating Promo Codes...")
    # Valid promo code
    res = client.post("/billing/validate-promo", json={"promo_code": "CYBER2026", "plan_name": "Pro", "billing_period": "monthly"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["valid"] is True
    assert data["discount_pct"] == 50.0
    assert data["original_price"] == 12.00
    assert data["final_price"] == 6.00
    print("    -> CYBER2026 (50% off) validated: $12.00 -> $6.00")

    # Invalid promo code
    res_inv = client.post("/billing/validate-promo", json={"promo_code": "INVALID_CODE_XYZ", "plan_name": "Pro", "billing_period": "monthly"})
    assert res_inv.status_code == 400
    print("    -> Invalid promo code correctly rejected with 400")

    print("[2] Registering Test User...")
    import uuid
    email = f"checkout_tester_{uuid.uuid4().hex[:6]}@cyberlearn.io"
    password = "SecurePassword123!"
    reg_res = client.post("/auth/register", json={"email": email, "password": password, "full_name": "Checkout Tester"})
    assert reg_res.status_code in [200, 201], f"Register failed: {reg_res.status_code} {reg_res.text}"
    
    login_res = client.post("/auth/login", json={"email": email, "password": password})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("[3] Testing Declined Card Simulation (ending in 0002)...")
    declined_payload = {
        "plan_name": "Pro",
        "billing_period": "monthly",
        "payment_method": "credit_card",
        "card_number": "4242 4242 4242 0002",
        "card_exp_month": 12,
        "card_exp_year": 2029,
        "card_cvc": "123",
        "cardholder_name": "Checkout Tester",
        "billing_country": "United States",
        "billing_zip": "94103"
    }
    dec_res = client.post("/billing/process-payment", json=declined_payload, headers=headers)
    assert dec_res.status_code == 402, f"Expected 402, got {dec_res.status_code}: {dec_res.text}"
    print("    -> Card ending in 0002 correctly simulated 402 Card Declined")

    print("[4] Testing Successful Payment & Subscription Activation...")
    success_payload = {
        "plan_name": "Pro",
        "billing_period": "annually",
        "payment_method": "credit_card",
        "card_number": "4242 4242 4242 4242",
        "card_exp_month": 10,
        "card_exp_year": 2030,
        "card_cvc": "789",
        "cardholder_name": "Checkout Tester",
        "billing_country": "United States",
        "billing_zip": "94103",
        "promo_code": "CYBER2026"
    }
    pay_res = client.post("/billing/process-payment", json=success_payload, headers=headers)
    assert pay_res.status_code == 200, f"Expected 200, got {pay_res.status_code}: {pay_res.text}"
    pay_data = pay_res.json()
    assert pay_data["status"] == "success"
    assert pay_data["is_subscribed"] is True
    assert pay_data["subscription_tier"] == "pro"
    assert pay_data["user_role"] == "pro_member"
    
    invoice = pay_data["invoice"]
    assert invoice["invoice_number"].startswith("INV-")
    assert invoice["plan_tier"] == "pro"
    assert invoice["billing_cycle"] == "annually"
    assert invoice["subtotal"] == 120.00
    assert invoice["discount_amount"] == 60.00 # 50% off
    assert invoice["total_paid"] == 60.00
    assert invoice["card_brand"] == "visa"
    assert invoice["card_last4"] == "4242"
    print(f"    -> Payment authorized! Invoice #{invoice['invoice_number']} minted for ${invoice['total_paid']}")

    print("[5] Verifying GET /billing/invoices...")
    inv_list_res = client.get("/billing/invoices", headers=headers)
    assert inv_list_res.status_code == 200
    invoices = inv_list_res.json()
    assert len(invoices) >= 1
    assert invoices[0]["id"] == invoice["id"]
    print(f"    -> Invoices query retrieved {len(invoices)} invoice(s) for user")

    print("[6] Verifying GET /billing/invoices/{id}...")
    inv_single_res = client.get(f"/billing/invoices/{invoice['id']}", headers=headers)
    assert inv_single_res.status_code == 200
    single_inv = inv_single_res.json()
    assert single_inv["invoice_number"] == invoice["invoice_number"]
    assert single_inv["total_paid"] == 60.00
    print("    -> Single invoice detail retrieved successfully")

    print("[7] Verifying Unlocked Access for Paid Subscriber...")
    # Access course detail
    courses_res = client.get("/courses")
    assert courses_res.status_code == 200
    courses = courses_res.json()
    if courses:
        course_id = courses[0]["id"]
        c_detail = client.get(f"/courses/{course_id}", headers=headers)
        assert c_detail.status_code == 200
        for l in c_detail.json().get("lessons", []):
            assert l["is_locked"] is False, "Lesson should be unlocked for subscriber"
        print("    -> All course lessons verified unlocked")

    print("\n[SUCCESS] All realistic checkout and billing tests PASSED successfully!\n")

if __name__ == "__main__":
    run_tests()
