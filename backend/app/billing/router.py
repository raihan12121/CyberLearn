import random
import re
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth.dependencies import get_current_user, has_active_subscription

router = APIRouter(
    prefix="/billing",
    tags=["Billing & Subscriptions"]
)

PROMO_CODES = {
    "CYBER2026": {"discount_pct": 50.0, "description": "50% Off New Year Cyber Special"},
    "HACKER100": {"discount_pct": 100.0, "description": "100% Off VIP First Cycle"},
    "STUDENT20": {"discount_pct": 20.0, "description": "20% Student Community Discount"},
    "SPRING25": {"discount_pct": 25.0, "description": "25% Spring Promotion"},
}

PLAN_BASE_PRICES = {
    "pro": {"monthly": 12.00, "annually": 120.00},
    "premium": {"monthly": 24.00, "annually": 240.00},
    "free": {"monthly": 0.00, "annually": 0.00},
}

def calculate_pricing(plan_name: str, billing_period: str, promo_code: Optional[str] = None):
    plan_key = plan_name.lower()
    period_key = billing_period.lower()
    
    if plan_key not in PLAN_BASE_PRICES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan name '{plan_name}'."
        )
        
    subtotal = PLAN_BASE_PRICES[plan_key].get(period_key, PLAN_BASE_PRICES[plan_key]["monthly"])
    discount_amount = 0.00
    discount_pct = 0.00
    
    if promo_code:
        code_upper = promo_code.strip().upper()
        if code_upper in PROMO_CODES:
            discount_pct = PROMO_CODES[code_upper]["discount_pct"]
            discount_amount = round(subtotal * (discount_pct / 100.0), 2)
            
    total_paid = max(0.00, round(subtotal - discount_amount, 2))
    return {
        "subtotal": subtotal,
        "discount_amount": discount_amount,
        "discount_pct": discount_pct,
        "tax_amount": 0.00,
        "total_paid": total_paid
    }

def detect_card_brand(card_num: str) -> str:
    cleaned = re.sub(r"\D", "", card_num)
    if cleaned.startswith("4"):
        return "visa"
    elif cleaned.startswith(("51", "52", "53", "54", "55")) or (len(cleaned) >= 4 and 2221 <= int(cleaned[:4]) <= 2720):
        return "mastercard"
    elif cleaned.startswith(("34", "37")):
        return "amex"
    elif cleaned.startswith(("6011", "65", "644", "645")):
        return "discover"
    return "card"


@router.post("/validate-promo", response_model=schemas.PromoValidationResponse)
def validate_promo_code(request: schemas.PromoValidationRequest):
    """
    Validate a discount promotional code against plan and billing period.
    """
    code_upper = request.promo_code.strip().upper()
    if code_upper not in PROMO_CODES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or expired promo code '{request.promo_code}'."
        )
        
    promo = PROMO_CODES[code_upper]
    pricing = calculate_pricing(request.plan_name, request.billing_period, code_upper)
    
    return schemas.PromoValidationResponse(
        valid=True,
        promo_code=code_upper,
        discount_pct=promo["discount_pct"],
        discount_amount=pricing["discount_amount"],
        original_price=pricing["subtotal"],
        final_price=pricing["total_paid"],
        message=f"{promo['description']} applied successfully ({int(promo['discount_pct'])}% off)!"
    )


@router.post("/process-payment")
def process_payment(
    request: schemas.ProcessPaymentRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Process realistic payment, validate card or payment token, generate digital invoice, and activate subscription.
    """
    valid_plans = ["Pro", "Premium", "Free"]
    if request.plan_name not in valid_plans:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan '{request.plan_name}'. Must be one of: {', '.join(valid_plans)}"
        )
        
    pricing = calculate_pricing(request.plan_name, request.billing_period, request.promo_code)
    
    card_brand = None
    card_last4 = None
    
    if request.payment_method == "credit_card":
        if request.card_number:
            card_num = (request.card_number or "").replace(" ", "").replace("-", "")
            if len(card_num) < 13 or not card_num.isdigit():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid credit card number. Please enter a valid 13-19 digit card number."
                )
                
            # Simulation of realistic test card declines
            if card_num.endswith("0002"):
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Your card was declined by the issuing bank. Please check your card balance or try a different card."
                )
            elif card_num.endswith("0003"):
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Payment failed: Insufficient funds in the designated account."
                )
                
            now_dt = datetime.now()
            if request.card_exp_year is not None and request.card_exp_month is not None:
                if request.card_exp_year < now_dt.year or (request.card_exp_year == now_dt.year and request.card_exp_month < now_dt.month):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="The card expiration date has already passed."
                    )
                    
            card_brand = detect_card_brand(card_num)
            card_last4 = card_num[-4:]
        else:
            card_brand = "visa"
            card_last4 = "4242"
    elif request.payment_method in ["paypal", "google_pay", "crypto"]:
        card_brand = request.payment_method
        card_last4 = "TOKEN"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported payment method '{request.payment_method}'."
        )
        
    # Upgrade user subscription
    days_to_add = 365 if request.billing_period == "annually" else 30
    now_utc = datetime.now(timezone.utc)
    
    plan_tier_val = request.plan_name.lower()
    current_user.subscription_tier = plan_tier_val
    current_user.subscription_status = "active"
    current_user.subscription_expires_at = now_utc + timedelta(days=days_to_add)
    
    if current_user.role not in ["admin", "instructor"]:
        current_user.role = f"{plan_tier_val}_member"
        
    # Create Invoice Record
    invoice_num = f"INV-{now_utc.year}-{random.randint(100000, 999999)}"
    invoice = models.Invoice(
        invoice_number=invoice_num,
        user_id=current_user.id,
        plan_tier=plan_tier_val,
        billing_cycle=request.billing_period,
        currency="USD",
        subtotal=pricing["subtotal"],
        discount_amount=pricing["discount_amount"],
        tax_amount=pricing["tax_amount"],
        total_paid=pricing["total_paid"],
        payment_method=request.payment_method,
        card_brand=card_brand,
        card_last4=card_last4,
        cardholder_name=request.cardholder_name or current_user.full_name or current_user.email,
        billing_country=request.billing_country or "United States",
        billing_zip=request.billing_zip or "10001",
        promo_code=request.promo_code.upper() if request.promo_code else None,
        status="paid"
    )
    
    db.add(invoice)
    db.commit()
    db.refresh(current_user)
    db.refresh(invoice)
    
    is_sub = has_active_subscription(current_user)
    return {
        "status": "success",
        "message": f"Payment successfully authorized! CyberLearn {request.plan_name} plan is now active.",
        "invoice": schemas.InvoiceResponse.model_validate(invoice),
        "user_role": current_user.role,
        "subscription_tier": current_user.subscription_tier,
        "subscription_status": current_user.subscription_status,
        "subscription_expires_at": current_user.subscription_expires_at,
        "is_subscribed": is_sub
    }


@router.post("/checkout")
def create_checkout_session(
    request: schemas.ProcessPaymentRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Backwards-compatible wrapper routing to payment processor.
    """
    return process_payment(request, db, current_user)


@router.get("/invoices", response_model=List[schemas.InvoiceResponse])
def get_user_invoices(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieve all historical billing invoices and receipts for the authenticated user.
    """
    invoices = (
        db.query(models.Invoice)
        .filter(models.Invoice.user_id == current_user.id)
        .order_by(models.Invoice.created_at.desc())
        .all()
    )
    return invoices


@router.get("/invoices/{invoice_id}", response_model=schemas.InvoiceResponse)
def get_invoice_detail(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get itemized details of a specific invoice.
    """
    invoice = (
        db.query(models.Invoice)
        .filter(models.Invoice.id == invoice_id, models.Invoice.user_id == current_user.id)
        .first()
    )
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found."
        )
    return invoice


@router.get("/status", response_model=schemas.SubscriptionStatusResponse)
def get_subscription_status(
    current_user: models.User = Depends(get_current_user)
):
    """
    Get current user's subscription entitlement, tier, and feature access permissions.
    """
    is_sub = has_active_subscription(current_user)
    return schemas.SubscriptionStatusResponse(
        tier=current_user.subscription_tier or ("pro" if current_user.role == "pro_member" else "premium" if current_user.role == "premium_member" else "free"),
        status=current_user.subscription_status or ("active" if is_sub else "inactive"),
        is_subscribed=is_sub,
        expires_at=current_user.subscription_expires_at,
        can_access_courses=is_sub,
        can_access_labs=is_sub,
        role=current_user.role
    )


@router.post("/cancel")
def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Cancel active subscription and revert user access to Free tier.
    """
    current_user.subscription_status = "canceled"
    current_user.subscription_tier = "free"
    current_user.subscription_expires_at = None
    if current_user.role not in ["admin", "instructor"]:
        current_user.role = "student"
        
    db.commit()
    db.refresh(current_user)
    
    return {
        "status": "success",
        "message": "Your subscription has been canceled. Courses and sandbox labs are now locked.",
        "subscription_status": "canceled",
        "user_role": current_user.role
    }


